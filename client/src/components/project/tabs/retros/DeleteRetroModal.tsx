'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ProjectRetroLink } from '@/types/project';

export interface DeleteRetroModalProps {
  retro: ProjectRetroLink | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * DeleteRetroModal:
 * Confirmation dialog for permanently deleting a linked retrospective session.
 */
export const DeleteRetroModal: React.FC<DeleteRetroModalProps> = ({
  retro,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!retro) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete Retrospective Session?</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Are you sure you want to delete <strong>&quot;{retro.title}&quot;</strong>? All sticky notes, votes, and takeaways will be permanently deleted from this project.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Session</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteRetroModal;
