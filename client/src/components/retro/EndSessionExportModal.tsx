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
} from 'lucide-react';
import { RetroTopic, StickyCard } from '@/types/retro';
import { useRetroProjectIntegration } from '@/hooks/useRetroProjectIntegration';
import { Modal } from '@/components/ui';

interface EndSessionExportModalProps {
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

  const handleExportAndCommit = async () => {
    if (!canExport) {
      alert('Access Denied: Only Project Lead, Managers, or Workspace Admins can export action items to the sprint backlog.');
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
      onSessionEnded();
    }
  };

  const handleClose = () => {
    resetExportState();
    onClose();
  };

  const isAllSelected =
    actionCards.length > 0 && selectedCardIds.length === actionCards.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        exportSuccess
          ? 'Action Items Exported!'
          : mode === 'export_only'
          ? 'Select & Export Action Items'
          : 'End Session & Export to Sprint'
      }
      description={
        exportSuccess
          ? 'Successfully transferred into project sprint backlog'
          : 'Select which action items to commit into the sprint backlog and assign developers.'
      }
      icon={<Sparkles className="w-5 h-5 text-[#88c958]" />}
      maxWidth="xl"
      footer={
        !exportSuccess ? (
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
              disabled={isExporting || selectedCardIds.length === 0 || !canExport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-md shadow-[#5cb028]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b846] dark:text-[#08090a]"
            >
              <Sparkles className="w-4 h-4 text-white dark:text-[#08090a]" />
              <span>
                {isExporting
                  ? 'Adding to Backlog...'
                  : !canExport
                  ? 'Export Restricted'
                  : `Export (${selectedCardIds.length}) Items to Sprint`}
              </span>
            </button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {!exportSuccess && !canExport && (
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
        {exportSuccess ? (
          /* Success State */
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-95 duration-200">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {exportedCount} Action Items Successfully Exported!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Transferred to <strong>{selectedProject?.name}</strong> under{' '}
                <span className="text-[#88c958] font-semibold">{lastExportedSprint?.name}</span>.
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href={`/projects/${selectedProject?.id}?tab=sprints`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5cb028] text-white text-xs font-bold hover:bg-[#4e9921] transition-all shadow-xs hover:scale-[1.02] dark:bg-[#88c958] dark:text-[#08090a] dark:hover:bg-[#76b846]"
              >
                <Layers className="w-4 h-4" />
                <span>Open Sprint Backlog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Export & Configuration State */
          <>
            {/* Target Project & Sprint Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/90 dark:border-white/[0.08]">
              {/* Destination Project Selector */}
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

              {/* Destination Sprint Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Target Sprint
                  </label>
                  <span className="text-[10px] text-[#3d8318] dark:text-[#88c958] font-bold bg-[#eaf5e3] dark:bg-[#88c958]/20 px-2 py-0.5 rounded border border-[#cdeac0] dark:border-[#88c958]/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#88c958]" />
                    Dedicated Retro Sprint
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
          </>
        )}
      </div>
    </Modal>
  );
};

export default EndSessionExportModal;
