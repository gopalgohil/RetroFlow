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
import { SprintCardsSkeleton } from '@/components/dashboard/DashboardSkeletons';

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
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const handleFilterChange = (tab: 'all' | 'active' | 'upcoming' | 'completed') => {
    if (tab === filter) return;
    setIsFilterLoading(true);
    setFilter(tab);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 380);
  };
  const [expandedSprintIds, setExpandedSprintIds] = useState<string[]>(() => {
    const active = (project.sprints || []).find((s) => s.status === 'active')?.id || project.sprints?.[0]?.id;
    return active ? [active] : [];
  });
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

  const allSprints = project.sprints || [];
  const filteredSprints = allSprints.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Filter Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['all', 'active', 'upcoming', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleFilterChange(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white dark:bg-slate-700 text-[#5cb028] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'all' ? `All Sprints (${allSprints.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sprints List */}
      {isFilterLoading ? (
        <SprintCardsSkeleton count={filteredSprints.length > 0 ? Math.min(filteredSprints.length, 3) : 3} />
      ) : filteredSprints.length === 0 ? (
        allSprints.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 flex items-center justify-center text-[#5cb028] mb-3 shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Sprints Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              No sprints have been created for this project yet. Sprints will appear here when planned or linked with a retrospective session.
            </p>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">No {filter} Sprints</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              No sprints found matching the selected filter. Try selecting &quot;All Sprints&quot; to view the entire timeline.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {filteredSprints.map((sprint) => {
            const isExpanded = expandedSprintIds.includes(sprint.id);

            return (
              <div
                key={sprint.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs bg-white dark:bg-[#0f172a] ${
                  sprint.status === 'active'
                    ? 'border-[#5cb028] dark:border-[#5cb028]/60 ring-2 ring-[#5cb028]/10'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Sprint Summary Header */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Number Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                        sprint.status === 'active'
                          ? 'bg-[#5cb028] text-white shadow-md shadow-[#5cb028]/20'
                          : sprint.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sprint.number}
                    </div>

                    {/* Title & Goal */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {sprint.name}
                        </h3>
                        <StatusPill status={sprint.status} />
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{sprint.goal}</p>

                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] pt-1 font-medium">
                        {canManageProject ? (
                          <button
                            type="button"
                            onClick={() => setEditingDatesSprint(sprint)}
                            title="Click to edit sprint start & end dates"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800 hover:bg-[#eaf5e3]/80 dark:hover:bg-[#5cb028]/20 text-slate-700 dark:text-slate-300 hover:text-[#3d8318] dark:hover:text-[#5cb028] font-semibold border border-slate-200/80 dark:border-slate-700 hover:border-[#cdeac0] dark:hover:border-[#5cb028]/40 shadow-2xs transition-all cursor-pointer group"
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#5cb028] group-hover:scale-105 transition-transform" />
                            <span>
                              {formatDateDMY(sprint.startDate)} → {formatDateDMY(sprint.endDate)}
                            </span>
                            <Pencil className="w-3 h-3 text-slate-400 group-hover:text-[#5cb028] transition-colors ml-0.5" />
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                            <Calendar className="w-3.5 h-3.5 text-[#5cb028]" />
                            <span>
                              {formatDateDMY(sprint.startDate)} → {formatDateDMY(sprint.endDate)}
                            </span>
                          </div>
                        )}

                        <span className="text-slate-300 dark:text-slate-600">•</span>

                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-[#5cb028]" />
                          {sprint.status === 'completed'
                            ? 'Completed'
                            : `${sprint.daysLeft} days remaining`}
                        </span>

                        {sprint.openBlockers > 0 && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
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
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Progress</span>
                            <span className="font-bold text-slate-900 dark:text-white">
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Sprint</span>
                        </button>
                      )}

                      {sprint.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => setConfirmSprint({ sprint, action: 'start' })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#5cb028]/60 hover:bg-[#eaf5e3]/50 dark:hover:bg-[#5cb028]/20 text-slate-600 dark:text-slate-300 hover:text-[#3d8318] dark:hover:text-[#5cb028] text-xs font-semibold transition-colors cursor-pointer"
                          title="Resume or reactivate this sprint"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Reopen</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpand(sprint.id)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#5cb028]" />
                        Sprint Backlog Stories & Action Items ({sprint.items.length})
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        Total Items: {sprint.items.length}
                      </span>
                    </div>

                    {sprint.items.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        No tickets assigned to this sprint yet. Export action items from a retro session
                        or add backlog items.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sprint.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <StatusPill status={item.type} />
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {item.title}
                                </p>
                                {item.sourceRetroTitle && (
                                  <p className="text-[10px] text-[#3d8318] dark:text-[#5cb028] mt-0.5 flex items-center gap-1 font-medium">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    From Retro: {item.sourceRetroTitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                              {item.storyPoints !== undefined && (
                                <span
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700"
                                  title="Story Points"
                                >
                                  {item.storyPoints} pts
                                </span>
                              )}

                              {item.assignee && (
                                <div className="flex items-center gap-1.5">
                                  <UserAvatar name={item.assignee.name} avatar={item.assignee.avatar} size="xs" />
                                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium hidden md:inline">
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
                                  className={`appearance-none pl-2.5 pr-7 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#5cb028]/30 ${
                                    item.status === 'done'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/90'
                                      : item.status === 'in_progress'
                                      ? 'bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#5cb028] border-[#cdeac0] dark:border-[#5cb028]/30 hover:bg-[#eaf5e3]/90'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  <option value="todo" className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 font-bold py-1">
                                    ○ TO DO
                                  </option>
                                  <option value="in_progress" className="text-[#3d8318] dark:text-[#5cb028] bg-white dark:bg-slate-900 font-bold py-1">
                                    ◑ IN PROGRESS
                                  </option>
                                  <option value="done" className="text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 font-bold py-1">
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
      )}

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
