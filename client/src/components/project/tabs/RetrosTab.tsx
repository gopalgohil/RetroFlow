'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Share2,
  Edit3,
  Trash2,
  Check,
  Calendar,
  AlertTriangle,
  Loader2,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Project, ProjectRetroLink } from '@/types/project';
import { StatusPill, UserAvatar } from '@/components/ui';
import { formatDateDMY } from '@/lib/dateUtils';
import { ShareInviteModal, ShareInviteSession } from '@/components/dashboard/ShareInviteModal';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';

interface RetrosTabProps {
  project: Project;
  onCreateRetroClick?: () => void;
  onProjectUpdated?: (updatedProject: Project) => void;
  canManageProject?: boolean;
}

export const RetrosTab: React.FC<RetrosTabProps> = ({
  project,
  onCreateRetroClick,
  onProjectUpdated,
  canManageProject = true,
}) => {
  // Share / Invite State
  const [invitingSession, setInvitingSession] = useState<ShareInviteSession | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Edit Modal State
  const [editingRetro, setEditingRetro] = useState<ProjectRetroLink | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSprintName, setEditSprintName] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingRetro, setDeletingRetro] = useState<ProjectRetroLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 6-item Pagination state
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  const retrosList = project.retrospectives || [];
  const totalItems = retrosList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedRetros = retrosList.slice(startIndex, endIndex);

  // Open Edit Modal
  const handleOpenEdit = (retro: ProjectRetroLink) => {
    setEditingRetro(retro);
    setEditTitle(retro.title);
    setEditSprintName(retro.sprintName || '');
    setEditScheduledDate(
      retro.scheduledDate
        ? new Date(retro.scheduledDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRetro || !editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      const payload = {
        title: editTitle.trim(),
        sprintName: editSprintName.trim(),
        scheduledDate: editScheduledDate,
      };

      const updated = await ProjectApiService.updateProjectRetro(
        project.id,
        editingRetro.id || editingRetro.shareToken,
        payload
      );

      if (onProjectUpdated && updated) {
        onProjectUpdated(updated);
      }
      setEditingRetro(null);
    } catch (err) {
      console.warn('[RetrosTab] Update via API fallback:', err);
      const fallback = ProjectDataService.updateProjectRetro(
        project.id,
        editingRetro.id || editingRetro.shareToken,
        {
          title: editTitle.trim(),
          sprintName: editSprintName.trim(),
          scheduledDate: editScheduledDate,
        }
      );
      if (fallback && onProjectUpdated) {
        onProjectUpdated(fallback);
      }
      setEditingRetro(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deletingRetro) return;

    setIsDeleting(true);
    try {
      const updated = await ProjectApiService.deleteProjectRetro(
        project.id,
        deletingRetro.id || deletingRetro.shareToken
      );

      if (onProjectUpdated && updated) {
        onProjectUpdated(updated);
      }
      setDeletingRetro(null);
    } catch (err) {
      console.warn('[RetrosTab] Delete via API fallback:', err);
      const fallback = ProjectDataService.deleteProjectRetro(
        project.id,
        deletingRetro.id || deletingRetro.shareToken
      );
      if (fallback && onProjectUpdated) {
        onProjectUpdated(fallback);
      }
      setDeletingRetro(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Copy Link / Open Invite Modal
  const handleShareClick = (retro: ProjectRetroLink) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/retro/${retro.shareToken}`;
      try {
        navigator.clipboard.writeText(url);
        setCopiedToken(retro.shareToken);
        setTimeout(() => setCopiedToken(null), 2000);
      } catch {}
    }

    setInvitingSession({
      _id: retro.id,
      title: retro.title,
      shareToken: retro.shareToken,
      status: retro.status,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Project Retrospectives
            <StatusPill status="upcoming" label={`${project.retrospectives?.length || 0} Sessions`} />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Collaborative agile feedback boards attached to <strong>{project.name}</strong> ({project.key}).
          </p>
        </div>

        {canManageProject && (project.retrospectives?.length || 0) > 0 && (
          <button
            type="button"
            onClick={onCreateRetroClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-md shadow-[#5cb028]/20 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Retrospective</span>
          </button>
        )}
      </div>

      {/* Retrospectives Grid */}
      {!project.retrospectives || project.retrospectives.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0f172a] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <UserAvatar name="RetroFlow" avatar="RF" size="lg" className="mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Retrospectives Linked Yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Schedule a retrospective session for this project to start gathering team feedback and generating action items.
          </p>
          {canManageProject && (
            <button
              type="button"
              onClick={onCreateRetroClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5cb028] text-white text-xs font-bold hover:bg-[#4e9921] transition-colors shadow-md shadow-[#5cb028]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Retrospective</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedRetros.map((retro) => {
            const isActive = retro.status === 'active';
            const isCopied = copiedToken === retro.shareToken;

            return (
              <div
                key={retro.id || retro.shareToken}
                className="group p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#5cb028]/60 dark:hover:border-[#5cb028]/60 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Status & Sprint Badge & Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusPill status={retro.status} pulse={isActive} />

                      {retro.sprintName && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#5cb028] border border-[#cdeac0] dark:border-[#5cb028]/30">
                          {retro.sprintName}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      {formatDateDMY(retro.scheduledDate)}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {retro.title}
                  </h4>

                  {/* Stats Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Topics</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {retro.topicsCount || 3} Columns
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Thoughts</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {retro.cardsCount || 0} Cards
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#eaf5e3]/70 dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30 text-center">
                      <span className="text-[10px] text-[#3d8318] dark:text-[#5cb028] block">Action Items</span>
                      <span className="text-xs font-bold text-[#3d8318] dark:text-[#5cb028]">
                        {retro.actionItemsCount || 0} Items
                      </span>
                    </div>
                  </div>

                  {/* Export Link Status */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    {retro.actionItemsExported ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Action items exported into sprint backlog
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        Pending export to next sprint backlog
                      </span>
                    )}
                  </div>
                </div>

                {/* Industry-Standard Action Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {/* Left: Launch Board + Share / Invite */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/retro/${retro.shareToken}`}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        isActive
                          ? 'bg-[#5cb028] hover:bg-[#4e9921] text-white shadow-[#5cb028]/20'
                          : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>Open Board</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>

                    {canManageProject && (
                      <button
                        type="button"
                        onClick={() => handleShareClick(retro)}
                        title="Share or Invite Teammates"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-[#eaf5e3]/70 dark:bg-[#5cb028]/20 hover:bg-[#eaf5e3] dark:hover:bg-[#5cb028]/30 text-[#3d8318] dark:text-[#5cb028] border-[#cdeac0] dark:border-[#5cb028]/40 hover:border-[#5cb028]/60 shadow-2xs"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-[#5cb028]" />
                            <span>Share / Invite</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right: Quick Action Buttons (Admin & Project Leads only) */}
                  {canManageProject && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(retro)}
                        title="Edit Retrospective Details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingRetro(retro)}
                        title="Delete Retrospective"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination Controls Footer (Active when > 6 retros) */}
          {totalPages > 1 && (
            <div className="p-4 sm:px-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-800 dark:text-white">{startIndex + 1}</strong> to{' '}
                <strong className="text-slate-800 dark:text-white">{endIndex}</strong> of{' '}
                <strong className="text-slate-800 dark:text-white">{totalItems}</strong> Retros
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      p === safeCurrentPage
                        ? 'bg-[#5cb028] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share / Invite Teammates Modal (Admin, Manager & Project Lead only) */}
      {canManageProject && (
        <ShareInviteModal
          isOpen={Boolean(invitingSession)}
          onClose={() => setInvitingSession(null)}
          session={invitingSession}
        />
      )}

      {/* Edit Retrospective Modal */}
      {editingRetro && (
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
                onClick={() => setEditingRetro(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Retrospective Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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
                    onChange={(e) => setEditSprintName(e.target.value)}
                    placeholder="e.g. Sprint 14"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5cb028]/30 focus:border-[#5cb028]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scheduled Date</label>
                  <input
                    type="date"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5cb028]/30 focus:border-[#5cb028]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRetro(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editTitle.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
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
      )}

      {/* Delete Retrospective Confirmation Modal */}
      {deletingRetro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete Retrospective Session?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete <strong>&quot;{deletingRetro.title}&quot;</strong>? All sticky notes, votes, and takeaways will be permanently deleted from this project.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingRetro(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
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
      )}
    </div>
  );
};

export default RetrosTab;
