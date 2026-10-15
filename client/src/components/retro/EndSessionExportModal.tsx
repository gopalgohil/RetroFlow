'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import { RetroTopic, StickyCard } from '@/types/retro';
import { useRetroProjectIntegration } from '@/hooks/useRetroProjectIntegration';
import { api, ENDPOINTS } from '@/lib/api';
import { Modal } from '@/components/ui';

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
  currentUser?: any;
}

interface ItemConfig {
  assigneeName: string;
  storyPoints: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

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

  // Filter cards strictly belonging to Action Items topic(s) or explicitly designated action items
  const actionCards = useMemo(() => {
    // 1. Identify all topicIds that belong to Action Items columns
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

    // 2. Strict filtering: Only include cards from Action Items topic(s) or explicitly prefixed
    return cards.filter((c) => {
      if (c.topicId && actionTopicIds.has(c.topicId)) {
        return true;
      }
      const textLower = (c.text || '').toLowerCase().trim();
      if (
        textLower.startsWith('action:') ||
        textLower.startsWith('[action]') ||
        textLower.startsWith('todo:')
      ) {
        return true;
      }
      if (c.topicId && c.topicId.toLowerCase().includes('action')) {
        return true;
      }
      return false;
    });
  }, [cards, topics]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');

  // Selected item IDs (multi-select checkboxes)
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Per-item configuration (assignee, priority)
  const [itemConfigs, setItemConfigs] = useState<Record<string, ItemConfig>>({});

  // Auto-select linked project & linked individual sprint
  useEffect(() => {
    if (projects.length === 0) return;

    // 1. Resolve target project
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

    // 2. Resolve individual target sprint
    let targetSprint = null;

    // A. Explicit sprintId
    if (sprintId) {
      targetSprint = targetProj.sprints?.find((s) => s.id === sprintId);
    }

    // B. Matching sprintName (e.g. "Sprint 2")
    if (!targetSprint && sprintName) {
      const match = sprintName.match(/\d+/);
      const sprintNum = match ? parseInt(match[0], 10) : null;
      targetSprint = targetProj.sprints?.find(
        (s) =>
          (sprintNum !== null && s.number === sprintNum) ||
          s.name.toLowerCase().includes(sprintName.toLowerCase())
      );
    }

    // C. Parse from retroTitle (e.g. "Sprint 2 Retrospective")
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

    // D. Fallback to suggested or first sprint
    if (!targetSprint) {
      targetSprint = getSuggestedSprint(targetProj.id) || targetProj.sprints?.[0] || null;
    }

    if (targetSprint) {
      setSelectedSprintId(targetSprint.id);
    }
  }, [projects, projectId, projectKey, sprintId, sprintName, retroTitle, getSuggestedSprint, isOpen]);

  // Initialize selected card IDs and default item configs when modal opens or cards change
  useEffect(() => {
    if (actionCards.length > 0) {
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
    }
  }, [actionCards, isOpen]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const suggestedSprint = useMemo(() => {
    return selectedProject ? getSuggestedSprint(selectedProject.id) : null;
  }, [selectedProject, getSuggestedSprint]);

  const currentSprint = useMemo(() => {
    if (!selectedProject?.sprints || selectedProject.sprints.length === 0) return null;
    const targetId = selectedSprintId || suggestedSprint?.id;
    return (
      selectedProject.sprints.find((s) => s.id === targetId) ||
      selectedProject.sprints.find((s) => s.status === 'active') ||
      selectedProject.sprints[0] ||
      null
    );
  }, [selectedProject, selectedSprintId, suggestedSprint]);

  const [isSprintDropdownOpen, setIsSprintDropdownOpen] = useState(false);
  const sprintDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sprintDropdownRef.current && !sprintDropdownRef.current.contains(e.target as Node)) {
        setIsSprintDropdownOpen(false);
      }
    };
    if (isSprintDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSprintDropdownOpen]);

  // Toggle single card selection
  const handleToggleCard = (cardId: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  // Toggle select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedCardIds.length === actionCards.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(actionCards.map((c) => c.id));
    }
  };

  // Update config for a specific card
  const handleUpdateItemConfig = (
    cardId: string,
    updates: Partial<ItemConfig>
  ) => {
    setItemConfigs((prev) => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || { assigneeName: '', storyPoints: 3, priority: 'high' }),
        ...updates,
      },
    }));
  };

  const [isEndingOnly, setIsEndingOnly] = useState(false);
  const [sessionEndedSuccess, setSessionEndedSuccess] = useState(false);
  const [showNoActionConfirm, setShowNoActionConfirm] = useState(false);

  const isEmptyBoard = (cards || []).length === 0;

  const executeCompleteWithoutItems = async () => {
    setIsEndingOnly(true);
    try {
      if (onSessionEnded) {
        await onSessionEnded();
      } else {
        await api.put(`${ENDPOINTS.RETROS}/${retroId}`, { status: 'completed' });
      }
      setSessionEndedSuccess(true);
      setShowNoActionConfirm(false);
    } catch (err: any) {
      alert('Failed to complete session: ' + (err.message || 'Unknown error'));
    } finally {
      setIsEndingOnly(false);
    }
  };

  const handleExportAndCommit = async () => {
    if (!canExport) {
      alert('Access Denied: Only Project Lead, Managers, or Workspace Admins can export action items or end this session.');
      return;
    }

    // Tier 1 Guard: Cannot complete empty board
    if (mode === 'end_and_export' && isEmptyBoard) {
      alert('Cannot complete an empty retrospective session. No feedback cards have been submitted yet.');
      return;
    }

    // Tier 2 Guard: In end_and_export mode with 0 items selected (or no action cards exist)
    if (mode === 'end_and_export' && selectedCardIds.length === 0) {
      if (!showNoActionConfirm) {
        setShowNoActionConfirm(true);
        return;
      }
      await executeCompleteWithoutItems();
      return;
    }

    if (!selectedProject || selectedCardIds.length === 0) return;
    const sprintIdToUse =
      selectedSprintId || suggestedSprint?.id || selectedProject.sprints[0]?.id;

    // Filter only the selected action cards and attach user-chosen configurations
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

    if (onSessionEnded && mode === 'end_and_export') {
      try {
        await onSessionEnded();
      } catch {}
    }
  };

  const handleClose = () => {
    setIsSprintDropdownOpen(false);
    setIsEndingOnly(false);
    setShowNoActionConfirm(false);
    setSessionEndedSuccess(false);
    resetExportState();
    onClose();
  };

  const isAllSelected =
    actionCards.length > 0 && selectedCardIds.length === actionCards.length;

  const isAnySuccess = exportSuccess || sessionEndedSuccess;

  const isCompactMode =
    (isEmptyBoard && mode === 'end_and_export') ||
    (showNoActionConfirm && mode === 'end_and_export') ||
    isAnySuccess;

  const renderFooter = () => {
    if (isEmptyBoard && mode === 'end_and_export') {
      return (
        <button
          type="button"
          onClick={handleClose}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          Return to Board
        </button>
      );
    }

    if (showNoActionConfirm && mode === 'end_and_export') {
      return (
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={executeCompleteWithoutItems}
            disabled={isEndingOnly}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isEndingOnly ? 'Ending...' : 'End Anyway'}
          </button>
        </>
      );
    }

    if (isAnySuccess) {
      return (
        <>
          {exportedCount > 0 && selectedProject && (
            <Link
              href={`/projects/${selectedProject.id}?tab=sprints`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold transition-all shadow-xs dark:bg-[#88c958] dark:hover:bg-[#76b846] dark:text-[#08090a]"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sprint Backlog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            Close
          </button>
        </>
      );
    }

    return (
      <>
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
            isEndingOnly ||
            !canExport ||
            (mode === 'export_only' && selectedCardIds.length === 0)
          }
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-md shadow-[#5cb028]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b846] dark:text-[#08090a]"
        >
          <Sparkles className="w-4 h-4 text-white dark:text-[#08090a]" />
          <span>
            {isExporting || isEndingOnly
              ? 'Processing...'
              : !canExport
              ? 'Export Restricted'
              : mode === 'end_and_export'
              ? selectedCardIds.length > 0
                ? `End Session & Export (${selectedCardIds.length}) Items`
                : 'End Session & Complete'
              : `Export (${selectedCardIds.length}) Items to Sprint`}
          </span>
        </button>
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth={isCompactMode ? 'sm' : 'xl'}
      showCloseButton={!isCompactMode}
      title={
        !isCompactMode
          ? mode === 'export_only'
            ? 'Select & Export Action Items'
            : 'End Session & Export to Sprint'
          : undefined
      }
      description={
        !isCompactMode
          ? mode === 'export_only'
            ? 'Select action items to commit into the sprint backlog.'
            : 'Select which action items to commit into the sprint backlog and assign developers.'
          : undefined
      }
      icon={!isCompactMode ? <Sparkles className="w-5 h-5 text-white dark:text-[#08090a]" /> : undefined}
      footer={renderFooter()}
    >
      {isEmptyBoard && mode === 'end_and_export' ? (
        /* Clean & Minimal Empty Board Alert */
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Board is Empty
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Please add feedback cards before ending this session.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : showNoActionConfirm && mode === 'end_and_export' ? (
        /* Clean & Minimal No Action Items Confirmation */
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                No Action Items
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No action items were selected. End this session anyway?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : isAnySuccess ? (
        /* Clean & Minimal Success State */
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Session Completed
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {exportedCount > 0 ? (
                  <>
                    {exportedCount} action item{exportedCount > 1 ? 's' : ''} exported to{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{selectedProject?.name}</strong>.
                  </>
                ) : (
                  'The retrospective session has ended successfully.'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Normal Export & Configuration State */
        <div className="space-y-5">
          {!canExport && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Export Restricted (Manager / Lead Only)</p>
                <p className="text-amber-700 dark:text-amber-300/80 text-[11px] mt-0.5">
                  Only Workspace Admins, Project Managers, and Team Leads can export retrospective action items to the sprint backlog.
                </p>
              </div>
            </div>
          )}
            {/* Target Project & Sprint Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/90 dark:border-white/[0.08]">
              {/* Destination Project Selector */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Target Project
                </label>
                <div className="relative">
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
                      setIsSprintDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141720] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#88c958]/30 focus:border-[#88c958] cursor-pointer appearance-none pr-8"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id} className="dark:bg-[#141720]">
                        {proj.name} ({proj.key})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Destination Sprint Selector */}
              <div className="space-y-1 relative" ref={sprintDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Target Sprint
                  </label>
                  <span className="text-[10px] text-[#3d8318] dark:text-[#88c958] font-bold bg-[#eaf5e3] dark:bg-[#88c958]/20 px-2 py-0.5 rounded border border-[#cdeac0] dark:border-[#88c958]/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#88c958]" />
                    Dedicated Retro Sprint
                  </span>
                </div>

                {/* Custom Sprint Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => setIsSprintDropdownOpen((prev) => !prev)}
                  className={`w-full px-3 py-2 bg-white dark:bg-[#141720] border rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    isSprintDropdownOpen
                      ? 'border-[#88c958] ring-2 ring-[#88c958]/25 shadow-xs'
                      : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
                  }`}
                  aria-expanded={isSprintDropdownOpen}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {currentSprint ? (
                      <>
                        <span
                          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            currentSprint.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                              : currentSprint.status === 'upcoming'
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25'
                              : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25'
                          }`}
                        >
                          {currentSprint.status === 'active' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          {currentSprint.status.toUpperCase()}
                        </span>
                        <span className="truncate text-slate-900 dark:text-white font-bold" title={currentSprint.name}>
                          {currentSprint.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">No sprint available</span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isSprintDropdownOpen ? 'rotate-180 text-[#88c958]' : ''
                    }`}
                  />
                </button>

                {/* Custom Sprint Dropdown Popover */}
                {isSprintDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 sm:right-0 sm:left-auto sm:min-w-[340px] w-full mt-1.5 bg-white dark:bg-[#161a23] border border-slate-200 dark:border-white/[0.1] rounded-xl shadow-2xl p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-[220px] overflow-y-auto space-y-1 pr-0.5 overscroll-contain">
                      {(!selectedProject?.sprints || selectedProject.sprints.length === 0) ? (
                        <div className="px-3 py-3 text-center text-xs text-slate-400">
                          No sprints found in this project
                        </div>
                      ) : (
                        selectedProject.sprints.map((sp) => {
                          const isSelected = sp.id === currentSprint?.id;
                          const isSuggested = sp.id === suggestedSprint?.id;
                          return (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => {
                                setSelectedSprintId(sp.id);
                                setIsSprintDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between gap-2.5 cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#88c958]/10 border-[#88c958]/30 dark:bg-[#88c958]/15 text-slate-900 dark:text-white'
                                  : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {sp.name}
                                  </span>
                                  <span
                                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider ${
                                      sp.status === 'active'
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                        : sp.status === 'upcoming'
                                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                                    }`}
                                  >
                                    {sp.status}
                                  </span>
                                  {isSuggested && (
                                    <span className="text-[9px] font-semibold text-[#3d8318] dark:text-[#88c958] bg-[#eaf5e3] dark:bg-[#88c958]/20 px-1.5 py-0.5 rounded border border-[#cdeac0] dark:border-[#88c958]/30">
                                      Suggested
                                    </span>
                                  )}
                                </div>

                                {/* Full Sprint Details ("sabhi bat dikhao") */}
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  {sp.startDate && sp.endDate ? (
                                    <span>
                                      {sp.startDate} → {sp.endDate}
                                    </span>
                                  ) : (
                                    <span>Sprint #{sp.number || 1}</span>
                                  )}
                                  {sp.daysLeft !== undefined && (
                                    <span>• {sp.daysLeft}d left</span>
                                  )}
                                  {Array.isArray(sp.items) && (
                                    <span>• {sp.items.length} items</span>
                                  )}
                                </div>
                              </div>

                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#88c958] text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Items Interactive Checklist */}
            <div className="space-y-2.5">
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
              <div className="max-h-64 overflow-y-auto space-y-2 p-1.5 border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#0e1015]">
                {actionCards.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No action items found on board.</p>
                    <p>Only cards created under the &quot;Action Items&quot; column can be exported to the sprint backlog.</p>
                    {mode === 'end_and_export' && (
                      <p className="text-[#3d8318] dark:text-[#88c958] font-bold pt-1.5">
                        You can still end this retrospective session by clicking &quot;End Session &amp; Complete&quot; below.
                      </p>
                    )}
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
                        {/* Top: Checkbox + Card Text */}
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

                        {/* Bottom: Assignee & Priority Selector (Only enabled if selected) */}
                        {isSelected && (
                          <div className="flex flex-wrap items-center gap-2 pl-7 pt-1 border-t border-[#cdeac0]/80 dark:border-white/[0.08]">
                            {/* Assignee Selector */}
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

                            {/* Priority Selector */}
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
          </div>
        )}
    </Modal>
  );
};

export default EndSessionExportModal;
