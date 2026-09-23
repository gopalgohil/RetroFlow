'use client';

import React from 'react';
import { Edit3, X, Loader2 } from 'lucide-react';
import { ProjectRetroLink } from '@/types/project';

export interface EditRetroModalProps {
  retro: ProjectRetroLink | null;
  editTitle: string;
  editSprintName: string;
  editScheduledDate: string;
  isSaving: boolean;
  onTitleChange: (val: string) => void;
  onSprintNameChange: (val: string) => void;
  onDateChange: (val: string) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

/**
 * EditRetroModal:
 * Dialog for editing title, sprint association, and date of a project retro.
 */
export const EditRetroModal: React.FC<EditRetroModalProps> = ({
  retro,
  editTitle,
  editSprintName,
  editScheduledDate,
  isSaving,
  onTitleChange,
  onSprintNameChange,
  onDateChange,
  onClose,
  onSave,
}) => {
  if (!retro) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#5cb028] flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Edit Retrospective</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Update title, sprint association, or date</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Retrospective Title</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Sprint 14 Retrospective"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5cb028]/30 focus:border-[#5cb028]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sprint Association</label>
              <input
                type="text"
                value={editSprintName}
                onChange={(e) => onSprintNameChange(e.target.value)}
                placeholder="e.g. Sprint 14"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5cb028]/30 focus:border-[#5cb028]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scheduled Date</label>
              <input
                type="date"
                value={editScheduledDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5cb028]/30 focus:border-[#5cb028]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !editTitle.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRetroModal;
