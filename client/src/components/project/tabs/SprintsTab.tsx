'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Play,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { Project, Sprint } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { StatusPill, ProgressBar, UserAvatar, ConfirmDialog } from '@/components/ui';
import { EditSprintDatesModal } from '@/components/project/EditSprintDatesModal';
import { formatDateDMY } from '@/lib/dateUtils';

interface SprintsTabProps {
  project: Project;
  onProjectUpdated: (updated: Project) => void;
  canManageProject?: boolean;
}

export const SprintsTab: React.FC<SprintsTabProps> = ({
  project,
  onProjectUpdated,
  canManageProject = true,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [expandedSprintIds, setExpandedSprintIds] = useState<string[]>([
    project.sprints.find((s) => s.status === 'active')?.id || project.sprints[0]?.id || '',
  ]);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [editingDatesSprint, setEditingDatesSprint] = useState<Sprint | null>(null);

  // Reusable confirmation dialog state
  const [confirmSprint, setConfirmSprint] = useState<{
    sprint: Sprint;
    action: 'start' | 'complete';
  } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSprintIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleUpdateItemStatus = async (
    sprintId: string,
    itemId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => {
    // 1. Optimistic UI update: instantly update local state & progress bar
    const updatedSprints = project.sprints.map((sp) => {
      if (sp.id === sprintId) {
        const updatedItems = sp.items.map((it) =>
          it.id === itemId ? { ...it, status: newStatus } : it
        );
        const completedPts = updatedItems
          .filter((it) => it.status === 'done')
          .reduce((sum, it) => sum + (it.storyPoints || 3), 0);

        return {
          ...sp,
          items: updatedItems,
          completedStoryPoints: completedPts,
        };
      }
      return sp;
    });

    const optimisticProject = { ...project, sprints: updatedSprints };
    onProjectUpdated(optimisticProject);
    setUpdatingItemId(itemId);

    try {
      // 2. Real API dispatch -> visible in browser Network tab!
      const updated = await ProjectApiService.updateSprintItemStatus(
        project.id,
        sprintId,
        itemId,
        newStatus
      );
      if (updated) onProjectUpdated(updated);
    } catch (err) {
      console.warn('[SprintsTab] API update fallback to mock:', err);
      const fallback = ProjectDataService.updateSprintItemStatus(
        project.id,
        sprintId,
        itemId,
        newStatus
      );
      if (fallback) onProjectUpdated(fallback);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleStartSprint = async (sprint: Sprint) => {
    try {
      // Live REST API request -> visible in browser Network tab!
      const updated = await ProjectApiService.startSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    } catch {
      const updated = ProjectDataService.startSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    }
    setConfirmSprint(null);
  };

  const handleCompleteSprint = async (sprint: Sprint) => {
    try {
      // Live REST API request -> visible in browser Network tab!
      const updated = await ProjectApiService.completeSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    } catch {
      const updated = ProjectDataService.completeSprint(project.id, sprint.id);
      if (updated) onProjectUpdated(updated);
    }
    setConfirmSprint(null);
  };

  const filteredSprints = project.sprints.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Filter Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'active', 'upcoming', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? `All Sprints (${project.sprints.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sprints List */}
      <div className="space-y-4">
        {filteredSprints.map((sprint) => {
          const isExpanded = expandedSprintIds.includes(sprint.id);

          return (
            <div
              key={sprint.id}
              className={`rounded-2xl bg-white border transition-all shadow-xs overflow-hidden ${
                sprint.status === 'active'
                  ? 'border-indigo-200/90 ring-1 ring-indigo-500/10'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Sprint Summary Header */}
              <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Number Badge */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      sprint.status === 'active'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : sprint.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sprint.number}
                  </div>

                  {/* Title & Goal */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                        {sprint.name}
                      </h3>
                      <StatusPill status={sprint.status} />
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{sprint.goal}</p>

                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] pt-1 font-medium">
                      {canManageProject ? (
                        <button
                          type="button"
                          onClick={() => setEditingDatesSprint(sprint)}
                          title="Click to edit sprint start & end dates"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-700 font-semibold border border-slate-200/80 hover:border-indigo-200 shadow-2xs transition-all cursor-pointer group"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-105 transition-transform" />
                          <span>
                            {formatDateDMY(sprint.startDate)} → {formatDateDMY(sprint.endDate)}
                          </span>
                          <Pencil className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors ml-0.5" />
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 font-semibold border border-slate-200/80 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {formatDateDMY(sprint.startDate)} → {formatDateDMY(sprint.endDate)}
                          </span>
                        </div>
                      )}

                      <span className="text-slate-300">•</span>

                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {sprint.status === 'completed'
                          ? 'Completed'
                          : `${sprint.daysLeft} days remaining`}
                      </span>

                      {sprint.openBlockers > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {sprint.openBlockers} blocker
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Progress & Action Triggers */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:self-center">
                  {/* Reusable ProgressBar dynamically calculated from items */}
                  {(() => {
                    const sprintItems = sprint.items || [];
                    const completedPts =
                      sprintItems.length > 0
                        ? sprintItems
                            .filter((i) => i.status === 'done')
                            .reduce((sum, it) => sum + (it.storyPoints || 3), 0)
                        : sprint.completedStoryPoints || 0;

                    const totalPts =
                      sprintItems.length > 0
                        ? sprintItems.reduce((sum, it) => sum + (it.storyPoints || 3), 0)
                        : sprint.totalStoryPoints || 1;

                    const progressPct =
                      totalPts > 0
                        ? Math.min(100, Math.round((completedPts / totalPts) * 100))
                        : 0;

                    return (
                      <div className="w-full sm:w-44 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Progress</span>
                          <span className="font-bold text-slate-900">
                            {progressPct}% complete
                          </span>
                        </div>
                        <ProgressBar
                          value={completedPts}
                          max={totalPts}
                          variant={progressPct === 100 ? 'emerald' : 'gradient'}
                          size="sm"
                        />
                      </div>
                    );
                  })()}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {sprint.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => setConfirmSprint({ sprint, action: 'complete' })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Complete Sprint</span>
                      </button>
                    )}

                    {sprint.status === 'upcoming' && (
                      <button
                        type="button"
                        onClick={() => setConfirmSprint({ sprint, action: 'start' })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Sprint</span>
                      </button>
                    )}

                    {sprint.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => setConfirmSprint({ sprint, action: 'start' })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition-colors cursor-pointer"
                        title="Resume or reactivate this sprint"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Reopen</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpand(sprint.id)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                      title={isExpanded ? 'Collapse backlog' : 'Expand backlog items'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Backlog Items Drawer */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Sprint Backlog Stories & Action Items ({sprint.items.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Total Items: {sprint.items.length}
                    </span>
                  </div>

                  {sprint.items.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      No tickets assigned to this sprint yet. Export action items from a retro session
                      or add backlog items.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sprint.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <StatusPill status={item.type} />
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-tight">
                                {item.title}
                              </p>
                              {item.sourceRetroTitle && (
                                <p className="text-[10px] text-indigo-600 mt-0.5 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  From Retro: {item.sourceRetroTitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                            {item.storyPoints !== undefined && (
                              <span
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold border border-slate-200"
                                title="Story Points"
                              >
                                {item.storyPoints} pts
                              </span>
                            )}

                            {item.assignee && (
                              <div className="flex items-center gap-1.5">
                                <UserAvatar name={item.assignee.name} avatar={item.assignee.avatar} size="xs" />
                                <span className="text-[11px] text-slate-600 font-medium hidden md:inline">
                                  {item.assignee.name}
                                </span>
                              </div>
                            )}

                            {/* Interactive Ticket Status Toggle Dropdown */}
                            <div className="relative inline-block">
                              <select
                                value={item.status}
                                disabled={updatingItemId === item.id}
                                onChange={(e) =>
                                  handleUpdateItemStatus(
                                    sprint.id,
                                    item.id,
                                    e.target.value as 'todo' | 'in_progress' | 'done'
                                  )
                                }
                                title="Click to update ticket status (TODO ➔ IN PROGRESS ➔ DONE)"
                                className={`appearance-none pl-2.5 pr-7 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                                  item.status === 'done'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/90 shadow-emerald-500/10'
                                    : item.status === 'in_progress'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100/90 shadow-indigo-500/10'
                                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 shadow-slate-500/10'
                                }`}
                              >
                                <option value="todo" className="text-slate-800 bg-white font-bold py-1">
                                  ○ TO DO
                                </option>
                                <option value="in_progress" className="text-indigo-700 bg-white font-bold py-1">
                                  ◑ IN PROGRESS
                                </option>
                                <option value="done" className="text-emerald-700 bg-white font-bold py-1">
                                  ● DONE
                                </option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronDown className="w-3.5 h-3.5 opacity-60 text-current" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reusable Confirmation Dialog for Start / Complete */}
      {confirmSprint && (
        <ConfirmDialog
          isOpen={Boolean(confirmSprint)}
          onClose={() => setConfirmSprint(null)}
          onConfirm={() =>
            confirmSprint.action === 'start'
              ? handleStartSprint(confirmSprint.sprint)
              : handleCompleteSprint(confirmSprint.sprint)
          }
          title={
            confirmSprint.action === 'start'
              ? `Start ${confirmSprint.sprint.name}?`
              : `Complete ${confirmSprint.sprint.name}?`
          }
          message={
            confirmSprint.action === 'start'
              ? 'Starting this sprint will initiate active tracking, burndown counters, and mark any currently active sprint as completed.'
              : 'Completing this sprint will complete current tickets and prepare open items to roll over into the next sprint.'
          }
          confirmLabel={confirmSprint.action === 'start' ? 'Start Sprint' : 'Complete Sprint'}
          variant={confirmSprint.action === 'start' ? 'primary' : 'success'}
        />
      )}

      {/* Custom Sprint Dates & Cycle Modal */}
      <EditSprintDatesModal
        isOpen={Boolean(editingDatesSprint)}
        onClose={() => setEditingDatesSprint(null)}
        sprint={editingDatesSprint}
        projectId={project.id}
        onSprintUpdated={(up) => onProjectUpdated(up)}
      />
    </div>
  );
};

export default SprintsTab;
