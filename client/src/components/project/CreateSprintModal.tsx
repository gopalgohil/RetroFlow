'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Check, AlertCircle, Plus } from 'lucide-react';
import { Modal } from '@/components/ui';
import { Sprint, Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { formatDateDMY } from '@/lib/dateUtils';

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  project: Project;
  referenceSprint?: Sprint | null;
  onSprintCreated: (updatedProject: Project, newSprint: Sprint) => void;
}

export const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
  isOpen,
  onClose,
  projectId,
  project,
  referenceSprint,
  onSprintCreated,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute smart defaults whenever modal opens or referenceSprint changes
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    const existingSprints = project.sprints || [];
    const maxNum = existingSprints.reduce((max, s) => Math.max(max, s.number || 0), 0);
    const nextNum = referenceSprint ? (referenceSprint.number || maxNum) + 1 : maxNum + 1;

    setName(`Sprint ${nextNum} - Execution & Backlog`);
    setGoal(`Sprint ${nextNum} deliverables and retrospective action items.`);

    // Determine smart start & end dates
    let baseRefDate: Date;
    if (referenceSprint?.endDate) {
      baseRefDate = new Date(referenceSprint.endDate);
    } else {
      // Find latest sprint endDate if any
      const sortedByEnd = [...existingSprints]
        .filter((s) => !!s.endDate)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

      if (sortedByEnd.length > 0) {
        baseRefDate = new Date(sortedByEnd[0].endDate);
      } else {
        baseRefDate = new Date();
      }
    }

    // Next day after reference date
    const nextStart = new Date(Date.UTC(baseRefDate.getUTCFullYear(), baseRefDate.getUTCMonth(), baseRefDate.getUTCDate() + 1));
    const nextStartStr = nextStart.toISOString().split('T')[0];
    setStartDate(nextStartStr);

    // Smart End Date: check if current month has >= 7 days left, or month end, or 14-day cadence
    const currentMonthEnd = new Date(Date.UTC(nextStart.getUTCFullYear(), nextStart.getUTCMonth() + 1, 0));
    const daysLeftInMonth = Math.ceil((currentMonthEnd.getTime() - nextStart.getTime()) / 86400000) + 1;

    let defaultEnd: Date;
    if (daysLeftInMonth >= 7) {
      // End at end of month
      defaultEnd = currentMonthEnd;
    } else {
      // Or end at next month's end
      defaultEnd = new Date(Date.UTC(nextStart.getUTCFullYear(), nextStart.getUTCMonth() + 2, 0));
    }

    setEndDate(defaultEnd.toISOString().split('T')[0]);
  }, [isOpen, referenceSprint, project]);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setError(null);

    if (newStart && endDate) {
      const startMs = new Date(newStart).getTime();
      const endMs = new Date(endDate).getTime();
      if (endMs < startMs) {
        const d = new Date(newStart);
        // Default to end of month for new start date
        const shiftedEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().split('T')[0];
        setEndDate(shiftedEnd);
      }
    }
  };

  const validation = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        isValid: false,
        errorMsg: 'Both Starting Date and Ending Date are required.',
      };
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (isNaN(startMs)) {
      return {
        isValid: false,
        errorMsg: 'Invalid Starting Date format.',
      };
    }

    if (isNaN(endMs)) {
      return {
        isValid: false,
        errorMsg: 'Invalid Ending Date format.',
      };
    }

    if (endMs < startMs) {
      return {
        isValid: false,
        errorMsg: 'Ending Date cannot be earlier than Starting Date.',
      };
    }

    const durationDays = Math.round((endMs - startMs) / 86400000) + 1;

    if (durationDays > 90) {
      return {
        isValid: false,
        errorMsg: 'Sprint duration cannot exceed 90 days.',
      };
    }

    return {
      isValid: true,
      durationDays,
    };
  }, [startDate, endDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) {
      setError(validation.errorMsg || 'Please correct the validation errors.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim() || undefined,
        startDate,
        endDate,
        goal: goal.trim() || undefined,
      };

      try {
        const res = await ProjectApiService.createSprint(projectId, payload);
        if (res && res.project && res.sprint) {
          onSprintCreated(res.project, res.sprint);
          onClose();
          return;
        }
      } catch (apiErr: any) {
        console.warn('[CreateSprintModal] API call failed, falling back to local storage:', apiErr);
      }

      // Local fallback
      const mockResult = ProjectDataService.createSprint(projectId, payload);
      if (mockResult) {
        onSprintCreated(mockResult.project, mockResult.sprint);
        onClose();
      } else {
        throw new Error('Failed to create sprint locally');
      }
    } catch (err: any) {
      console.error('[CreateSprintModal] Error creating sprint:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to create sprint. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onClose}
      title="Create New Sprint"
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Sprint Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            placeholder="e.g. Sprint 3 - Execution & Backlog"
            maxLength={150}
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-[#88c958] dark:focus:border-[#88c958]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-[#88c958] dark:focus:border-[#88c958]"
              />
            </div>
            {startDate && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {formatDateDMY(startDate)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setError(null);
                }}
                disabled={isSaving}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-[#88c958] dark:focus:border-[#88c958]"
              />
            </div>
            {endDate && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {formatDateDMY(endDate)}
              </p>
            )}
          </div>
        </div>

        {validation.isValid && validation.durationDays !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-[#88c958]" />
            <span>
              Duration: <strong className="text-slate-800 dark:text-slate-200">{validation.durationDays} days</strong>
              {validation.durationDays >= 7 && (
                <span className="text-slate-500 dark:text-slate-400"> ({Math.round((validation.durationDays / 7) * 10) / 10} weeks)</span>
              )}
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Sprint Goal (Optional)
          </label>
          <textarea
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isSaving}
            placeholder="Key deliverables and focus areas for this sprint..."
            maxLength={500}
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-[#88c958] dark:focus:border-[#88c958] resize-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !validation.isValid}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#88c958] hover:bg-[#76b34a] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Create Sprint</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
