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
  Hash,
  ListFilter,
  CheckSquare,
  Square,
} from 'lucide-react';
import { StickyCard } from '@/types/retro';
import { useRetroProjectIntegration } from '@/hooks/useRetroProjectIntegration';
import { Modal } from '@/components/ui';

interface EndSessionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  retroId: string;
  retroTitle: string;
  cards: StickyCard[];
  onSessionEnded?: () => void;
  mode?: 'export_only' | 'end_and_export';
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
  onSessionEnded,
  mode = 'end_and_export',
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

  // Filter cards that belong to Action Items / Improvements
  const actionCards = useMemo(() => {
    const filtered = cards.filter(
      (c) =>
        c.topicId?.toLowerCase().includes('action') ||
        c.topicId?.toLowerCase().includes('improve') ||
        c.text.toLowerCase().startsWith('action:') ||
        c.text.toLowerCase().startsWith('todo:')
    );
    return filtered.length > 0 ? filtered : cards.slice(0, 3);
  }, [cards]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');

  // Selected item IDs (multi-select checkboxes)
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Per-item configuration (assignee, story points, priority)
  const [itemConfigs, setItemConfigs] = useState<Record<string, ItemConfig>>({});

  // Auto-select first project & suggested sprint
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const defaultProj = projects[0];
      setSelectedProjectId(defaultProj.id);
      const sugg = getSuggestedSprint(defaultProj.id);
      setSelectedSprintId(sugg?.id || defaultProj.sprints?.[0]?.id || '');
    }
  }, [projects, selectedProjectId, getSuggestedSprint]);

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

  // Calculate total story points for selected items
  const totalSelectedSP = useMemo(() => {
    return selectedCardIds.reduce((sum, id) => {
      const config = itemConfigs[id];
      return sum + (config?.storyPoints || 3);
    }, 0);
  }, [selectedCardIds, itemConfigs]);

  const handleExportAndCommit = async () => {
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
      icon={<Sparkles className="w-5 h-5 text-indigo-600" />}
      maxWidth="xl"
      footer={
        !exportSuccess ? (
          <>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExportAndCommit}
              disabled={isExporting || selectedCardIds.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isExporting
                  ? 'Adding to Backlog...'
                  : `Export (${selectedCardIds.length}) Items to Sprint • ${totalSelectedSP} SP`}
              </span>
            </button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {exportSuccess ? (
          /* Success State */
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-95 duration-200">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                {exportedCount} Action Items Successfully Exported!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Transferred to <strong>{selectedProject?.name}</strong> under{' '}
                <span className="text-indigo-600 font-semibold">{lastExportedSprint?.name}</span> with total{' '}
                <span className="font-bold text-slate-800">{totalSelectedSP} SP</span>.
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href={`/projects/${selectedProject?.id}?tab=sprints`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs hover:scale-[1.02]"
              >
                <Layers className="w-4 h-4" />
                <span>Open Sprint Backlog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Export & Configuration State */
          <>
            {/* Target Project & Sprint Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              {/* Destination Project Selector */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
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
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Sprint Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Target Sprint
                  </label>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Auto-matched
                  </span>
                </div>
                <select
                  value={selectedSprintId || suggestedSprint?.id || ''}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer"
                >
                  {selectedProject?.sprints.map((sp) => (
                    <option key={sp.id} value={sp.id}>
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
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
                    Select Action Items to Export ({selectedCardIds.length}/{actionCards.length})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Total: {totalSelectedSP} SP
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isAllSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Select All</span>
                    </>
                  )}
                </button>
              </div>

              {/* Scrollable list of items */}
              <div className="max-h-64 overflow-y-auto space-y-2 p-1.5 border border-slate-200 rounded-2xl bg-white">
                {actionCards.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No action items found on board. Add cards in the Action Items column first.
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
                            ? 'bg-indigo-50/40 border-indigo-200/90 shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200/70 opacity-60'
                        }`}
                      >
                        {/* Top: Checkbox + Card Text */}
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCard(card.id)}
                            className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 leading-snug">
                              {card.text}
                            </p>
                            {card.author && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Raised by: <span className="font-semibold text-slate-600">{card.author}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Assignee & Story Points Selector (Only enabled if selected) */}
                        {isSelected && (
                          <div className="flex flex-wrap items-center gap-2 pl-7 pt-1 border-t border-indigo-100/80">
                            {/* Assignee Selector */}
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <select
                                value={cfg.assigneeName}
                                onChange={(e) =>
                                  handleUpdateItemConfig(card.id, {
                                    assigneeName: e.target.value,
                                  })
                                }
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              >
                                <option value="">Unassigned</option>
                                {selectedProject?.members?.map((m) => (
                                  <option key={m.id || m.name} value={m.name}>
                                    {m.name} ({m.role})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Story Points Selector */}
                            <div className="flex items-center gap-1.5">
                              <Hash className="w-3 h-3 text-slate-400" />
                              <select
                                value={cfg.storyPoints}
                                onChange={(e) =>
                                  handleUpdateItemConfig(card.id, {
                                    storyPoints: Number(e.target.value),
                                  })
                                }
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              >
                                {[1, 2, 3, 5, 8, 13].map((pts) => (
                                  <option key={pts} value={pts}>
                                    {pts} SP
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
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer capitalize"
                              >
                                {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                                  <option key={p} value={p}>
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
