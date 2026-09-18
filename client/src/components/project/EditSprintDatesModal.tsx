'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui';
import { Sprint, Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { formatDateDMY } from '@/lib/dateUtils';

interface EditSprintDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: Sprint | null;
  projectId: string;
  onSprintUpdated: (updatedProject: Project) => void;
}

export const EditSprintDatesModal: React.FC<EditSprintDatesModalProps> = ({
  isOpen,
  onClose,
  sprint,
  projectId,
  onSprintUpdated,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sprint) {
      setStartDate(sprint.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(
        sprint.endDate ||
          new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      );
      setGoal(sprint.goal || '');
      setName(sprint.name || '');
      setError(null);
    }
  }, [sprint, isOpen]);

  // Handle start date change with smart auto-adjustment for end date
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setError(null);

    if (newStart && endDate) {
      const startMs = new Date(newStart).getTime();
      const endMs = new Date(endDate).getTime();
      // If end date is now earlier than start date, auto-shift end date by 14 days
      if (endMs < startMs) {
        const shiftedEnd = new Date(startMs + 13 * 86400000).toISOString().split('T')[0];
        setEndDate(shiftedEnd);
      }
    }
  };

  // Comprehensive validation and live metrics
  const { metrics, validation } = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        metrics: null,
        validation: {
          isValid: false,
          errorMsg: 'Both Starting Date and Ending Date are required.',
          field: !startDate ? 'startDate' : 'endDate',
        },
      };
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const todayMs = new Date().setHours(0, 0, 0, 0);

    if (isNaN(startMs)) {
      return {
        metrics: null,
        validation: {
          isValid: false,
          errorMsg: 'Invalid Starting Date format.',
          field: 'startDate',
        },
      };
    }

    if (isNaN(endMs)) {
      return {
        metrics: null,
        validation: {
          isValid: false,
          errorMsg: 'Invalid Ending Date format.',
          field: 'endDate',
        },
      };
    }

    // Validation rule 1: End Date must be on or after Start Date
    if (endMs < startMs) {
      return {
        metrics: null,
        validation: {
          isValid: false,
          errorMsg: 'Ending Date cannot be earlier than Starting Date.',
          field: 'endDate',
        },
      };
    }

    const durationDays = Math.round((endMs - startMs) / 86400000) + 1;

    // Validation rule 2: Max sprint duration (90 days)
    if (durationDays > 90) {
      return {
        metrics: null,
        validation: {
          isValid: false,
          errorMsg: 'Sprint duration cannot exceed 90 days (~12 weeks). Standard agile sprints are 1 to 4 weeks.',
          field: 'endDate',
        },
      };
    }

    const daysRemaining = Math.max(0, Math.ceil((endMs - todayMs) / 86400000));
    const isPast = endMs < todayMs;

    return {
      metrics: {
        durationDays,
        daysRemaining,
        isPast,
      },
      validation: {
        isValid: true,
        errorMsg: null,
        field: null,
      },
    };
  }, [startDate, endDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprint) return;

    if (!validation.isValid) {
      setError(validation.errorMsg || 'Please correct the invalid dates.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      startDate,
      endDate,
      goal: goal.trim(),
      name: name.trim() || sprint.name,
    };

    try {
      // 1. Live REST API request -> visible in browser Network tab!
      const updated = await ProjectApiService.updateSprintDates(
        projectId,
        sprint.id,
        payload
      );
      if (updated) {
        onSprintUpdated(updated);
        onClose();
      }
    } catch (err: any) {
      console.warn('[EditSprintDates] Fallback to local persistence:', err);
      try {
        const fallback = ProjectDataService.updateSprintDates(
          projectId,
          sprint.id,
          payload
        );
        if (fallback) {
          onSprintUpdated(fallback);
          onClose();
        } else {
          setError(err.message || 'Failed to update sprint dates. Please try again.');
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Validation error saving dates.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!sprint) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Edit Sprint Dates & Cycle</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#88c958]/15 text-[#88c958] border border-[#88c958]/30 uppercase">
            Sprint {sprint.number}
          </span>
        </div>
      }
      description="Select custom start and end dates with real-time validation. Countdown and timeline will automatically recalculate."
      icon={<Calendar className="w-5 h-5 text-[#88c958]" />}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !validation.isValid}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#88c958] hover:bg-[#76b349] text-[#08090a] text-xs font-bold shadow-sm shadow-[#88c958]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <span>Saving Dates...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Sprint Dates</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        {/* Global Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sprint Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Sprint Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint 1 - Foundation & Kickoff"
            className="w-full px-3 py-2 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958]"
          />
        </div>

        {/* Start Date & End Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Starting Date */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#88c958]" />
                <span>Starting Date</span>
                <span className="text-rose-500">*</span>
              </label>
              {startDate && (
                <span className="text-[11px] font-mono font-bold text-[#88c958] bg-[#88c958]/15 px-1.5 py-0.5 rounded border border-[#88c958]/30">
                  {formatDateDMY(startDate)}
                </span>
              )}
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              required
              className={`w-full px-3 py-2 bg-white dark:bg-[#12151c] border rounded-xl text-xs text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                validation.field === 'startDate'
                  ? 'border-rose-400 dark:border-rose-600 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-white/[0.08] focus:ring-[#88c958]/20 focus:border-[#88c958]'
              }`}
            />
          </div>

          {/* Ending Date */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#88c958]" />
                <span>Ending Date</span>
                <span className="text-rose-500">*</span>
              </label>
              {endDate && (
                <span className="text-[11px] font-mono font-bold text-[#88c958] bg-[#88c958]/15 px-1.5 py-0.5 rounded border border-[#88c958]/30">
                  {formatDateDMY(endDate)}
                </span>
              )}
            </div>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setError(null);
              }}
              required
              className={`w-full px-3 py-2 bg-white dark:bg-[#12151c] border rounded-xl text-xs text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                validation.field === 'endDate'
                  ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-white/[0.08] focus:ring-[#88c958]/20 focus:border-[#88c958]'
              }`}
            />
          </div>
        </div>

        {/* Inline Field Error Message for Invalid Date Selection */}
        {!validation.isValid && validation.errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{validation.errorMsg}</span>
          </div>
        )}

        {/* Live Calculation Preview Card */}
        {metrics && validation.isValid && (
          <div className="p-3.5 rounded-2xl border bg-[#88c958]/10 border-[#88c958]/20 text-[#88c958]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#88c958] shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Cycle Duration:
                </span>
                <span className="font-bold text-[#88c958] font-mono">
                  {metrics.durationDays} Days ({formatDateDMY(startDate)} → {formatDateDMY(endDate)})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Countdown:</span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${
                    metrics.isPast
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {metrics.isPast
                    ? 'End Date Passed'
                    : `${metrics.daysRemaining} Days Remaining`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sprint Goal */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Sprint Goal & Deliverables (Optional)
          </label>
          <textarea
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Key deliverables, commitments, or focus areas for this sprint cycle..."
            className="w-full px-3 py-2 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditSprintDatesModal;
