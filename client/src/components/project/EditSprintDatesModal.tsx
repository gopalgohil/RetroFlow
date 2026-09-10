'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Sparkles, Check, AlertCircle, Zap } from 'lucide-react';
import { Modal } from '@/components/ui';
import { Sprint, Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';

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

  // Quick preset duration click (e.g. 7, 14, 21, 28 days)
  const applyPresetDuration = (days: number) => {
    if (!startDate) return;
    const startMs = new Date(startDate).getTime();
    if (isNaN(startMs)) return;

    const newEnd = new Date(startMs + (days - 1) * 86400000).toISOString().split('T')[0];
    setEndDate(newEnd);
    setError(null);
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
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
            Sprint {sprint.number}
          </span>
        </div>
      }
      description="Select custom start and end dates with real-time validation. Countdown and timeline will automatically recalculate."
      icon={<Calendar className="w-5 h-5 text-indigo-600" />}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !validation.isValid}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sprint Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Sprint Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint 1 - Foundation & Kickoff"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Start Date & End Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Starting Date */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Starting Date</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              required
              className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                validation.field === 'startDate'
                  ? 'border-rose-400 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Ending Date */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ending Date</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setError(null);
              }}
              required
              className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                validation.field === 'endDate'
                  ? 'border-rose-400 bg-rose-50/20 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
          </div>
        </div>

        {/* Inline Field Error Message for Invalid Date Selection */}
        {!validation.isValid && validation.errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{validation.errorMsg}</span>
          </div>
        )}

        {/* Quick Duration Preset Shortcuts */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Quick Cycle Presets</span>
            </span>
            <span className="text-slate-400 text-[10px]">Sets ending date from start date</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: '1 Week', days: 7 },
              { label: '2 Weeks', days: 14, popular: true },
              { label: '3 Weeks', days: 21 },
              { label: '4 Weeks', days: 28 },
            ].map((preset) => {
              const isSelected = metrics?.durationDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => applyPresetDuration(preset.days)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        {metrics && validation.isValid && (
          <div className="p-3.5 rounded-2xl border bg-indigo-50/60 border-indigo-200/80 text-indigo-950">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-700">
                  Cycle Duration:
                </span>
                <span className="font-bold text-indigo-700 font-mono">
                  {metrics.durationDays} Days (
                  {Math.round((metrics.durationDays / 7) * 10) / 10} Weeks)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Countdown:</span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${
                    metrics.isPast
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
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
          <label className="block text-xs font-bold text-slate-700">
            Sprint Goal & Deliverables (Optional)
          </label>
          <textarea
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Key deliverables, commitments, or focus areas for this sprint cycle..."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditSprintDatesModal;
