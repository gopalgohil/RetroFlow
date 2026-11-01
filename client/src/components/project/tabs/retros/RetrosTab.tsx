'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Lock, ExternalLink } from 'lucide-react';
import { Project, ProjectRetroLink } from '@/types/project';
import { RetroBoard, CreateRetroPayload } from '@/types/retro';
import { StatusPill, UserAvatar } from '@/components/ui';
import { ShareInviteModal, ShareInviteSession } from '@/components/dashboard/ShareInviteModal';
import { CustomizeRetroModal } from '@/components/dashboard/CustomizeRetroModal';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { api } from '@/lib/api';
import { RetroCard } from './RetroCard';
import { RetroCardSkeleton } from './RetroCardSkeleton';
import { RetrosPagination } from './RetrosPagination';
import { DeleteRetroModal } from './DeleteRetroModal';

export interface RetrosTabProps {
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
  const [invitingSession, setInvitingSession] = useState<ShareInviteSession | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [editingBoard, setEditingBoard] = useState<RetroBoard | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const [deletingRetro, setDeletingRetro] = useState<ProjectRetroLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentMonthName = useMemo(() => new Date().toLocaleString('en-US', { month: 'long' }), []);

  const activeMonthlyRetro = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0));

    return (project.retrospectives || []).find((r) => {
      const rDate = r.startDate || r.scheduledDate ? new Date(r.startDate || r.scheduledDate) : null;
      const rEndDate = r.endDate ? new Date(r.endDate) : null;
      const isSameMonth = rDate && rDate >= startOfMonth && rDate <= endOfMonth;
      const isNotExpired = rEndDate ? rEndDate >= todayMidnight : true;
      return isSameMonth && isNotExpired;
    });
  }, [project.retrospectives]);

  const ITEMS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedRetros, setPaginatedRetros] = useState<ProjectRetroLink[]>(
    (project.retrospectives || []).slice(0, ITEMS_PER_PAGE)
  );
  const [paginationMeta, setPaginationMeta] = useState<{
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    totalItems: project.retrospectives?.length || 0,
    totalPages: Math.ceil((project.retrospectives?.length || 0) / ITEMS_PER_PAGE) || 1,
    hasNextPage: (project.retrospectives?.length || 0) > ITEMS_PER_PAGE,
    hasPrevPage: false,
  });
  const [isLoadingRetros, setIsLoadingRetros] = useState(false);

  const fetchRetrosPage = useCallback(
    async (page: number) => {
      setIsLoadingRetros(true);
      try {
        const res = await ProjectApiService.getProjectRetros(project.id, {
          page,
          limit: ITEMS_PER_PAGE,
        });
        if (res && res.retrospectives) {
          setPaginatedRetros(res.retrospectives);
          setPaginationMeta({
            totalItems: res.pagination.totalItems,
            totalPages: res.pagination.totalPages,
            hasNextPage: res.pagination.hasNextPage,
            hasPrevPage: res.pagination.hasPrevPage,
          });
        }
      } catch (err) {
        console.warn('[RetrosTab] API fetch fallback to local slice:', err);
        const all = project.retrospectives || [];
        const start = (page - 1) * ITEMS_PER_PAGE;
        setPaginatedRetros(all.slice(start, start + ITEMS_PER_PAGE));
        setPaginationMeta({
          totalItems: all.length,
          totalPages: Math.ceil(all.length / ITEMS_PER_PAGE) || 1,
          hasNextPage: page * ITEMS_PER_PAGE < all.length,
          hasPrevPage: page > 1,
        });
      } finally {
        setIsLoadingRetros(false);
      }
    },
    [project.id, project.retrospectives]
  );

  useEffect(() => {
    fetchRetrosPage(currentPage);
  }, [currentPage, fetchRetrosPage]);

  const handleOpenEdit = async (retro: ProjectRetroLink) => {
    const identifier = retro.id || retro.shareToken;
    try {
      const res = await api.get(`/api/retros/${identifier}`);
      const board = res.data?.data || res.data;
      if (board && (board._id || board.title)) {
        setEditingBoard(board);
      } else {
        throw new Error('Invalid board response');
      }
    } catch (err) {
      console.warn('[RetrosTab] Could not fetch live retro board, using fallback:', err);
      const fallbackBoard: RetroBoard = {
        _id: retro.id,
        title: retro.title,
        scheduledDate: retro.scheduledDate,
        startDate: retro.startDate || retro.scheduledDate,
        endDate: retro.endDate || null,
        status: retro.status,
        shareToken: retro.shareToken,
        approvalRequired: false,
        revealMode: false,
        votingLimit: 1,
        backgroundTheme: 'standard',
        topics: [
          { topicId: 'topic-1', title: 'What went well?', description: 'Things we are happy or proud of', icon: 'smile', color: '#10B981', order: 0 },
          { topicId: 'topic-2', title: 'What could be improved?', description: 'Blockers, frictions, or slowdowns', icon: 'frown', color: '#F43F5E', order: 1 },
          { topicId: 'topic-3', title: 'Action Items', description: 'Concrete tasks for the next sprint', icon: 'target', color: '#0EA5E9', order: 2 },
        ],
        approvedMembers: (project.members || []).map((m) => m.email),
        projectId: project.id,
        projectKey: project.key,
        sprintName: retro.sprintName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEditingBoard(fallbackBoard);
    }
    setIsCustomizeOpen(true);
  };

  const handleSaveCustomize = async (payload: CreateRetroPayload) => {
    if (!editingBoard) return;
    const identifier = editingBoard._id || editingBoard.shareToken;

    try {
      await api.put(`/api/retros/${identifier}`, payload);
      const updatedProject = await ProjectApiService.getProjectById(project.id, true);
      if (updatedProject && onProjectUpdated) {
        onProjectUpdated(updatedProject);
      }
      await fetchRetrosPage(currentPage);
    } catch (err) {
      console.warn('[RetrosTab] PUT retro failed, falling back to project API & local cache:', err);
      try {
        const updated = await ProjectApiService.updateProjectRetro(project.id, identifier, {
          title: payload.title,
          scheduledDate: payload.scheduledDate,
          startDate: payload.startDate,
          endDate: payload.endDate,
          sprintName: payload.sprintName,
        });
        if (updated && onProjectUpdated) {
          onProjectUpdated(updated);
        }
        await fetchRetrosPage(currentPage);
      } catch {
        const fallback = ProjectDataService.updateProjectRetro(project.id, identifier, {
          title: payload.title,
          scheduledDate: payload.scheduledDate,
          startDate: payload.startDate,
          endDate: payload.endDate,
          sprintName: payload.sprintName,
        });
        if (fallback && onProjectUpdated) {
          onProjectUpdated(fallback);
        }
        await fetchRetrosPage(currentPage);
      }
    } finally {
      setIsCustomizeOpen(false);
      setEditingBoard(null);
    }
  };

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
      await fetchRetrosPage(currentPage);
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
      await fetchRetrosPage(currentPage);
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Project Retrospectives
            <StatusPill status="upcoming" label={`${paginationMeta.totalItems} Sessions`} />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Collaborative agile feedback boards attached to <strong>{project.name}</strong> ({project.key}).
          </p>
        </div>

        {canManageProject && (paginationMeta.totalItems > 0 || (project.retrospectives?.length || 0) > 0) && (
          activeMonthlyRetro ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 text-xs font-bold border border-slate-200/90 dark:border-white/[0.08] cursor-not-allowed select-none shadow-xs"
              title={`${currentMonthName} retrospective is already active for ${project.name}. Company policy permits only 1 retrospective per project per month until month-end.`}
            >
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Create Retrospective</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateRetroClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-md shadow-[#5cb028]/20 transition-all hover:scale-[1.01] cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a] dark:shadow-[#88c958]/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Retrospective</span>
            </button>
          )
        )}
      </div>

      {activeMonthlyRetro && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-amber-600 dark:text-amber-400 font-black text-sm mt-0.5 sm:mt-0">ℹ️</span>
            <div>
              <p className="font-extrabold text-amber-900 dark:text-amber-200">
                {currentMonthName} Retrospective is already active for this project
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-[11px] mt-0.5">
                In accordance with company policy, 1 retrospective per project per month is allowed until month-end. You can manage, export, or delete the current session to make changes.
              </p>
            </div>
          </div>
          {activeMonthlyRetro.shareToken && (
            <Link
              href={`/retro/${activeMonthlyRetro.shareToken}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Open Active Retro</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {!isLoadingRetros && paginationMeta.totalItems === 0 && (!project.retrospectives || project.retrospectives.length === 0) ? (
        <div className="p-12 text-center bg-white dark:bg-[#0e1015] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] space-y-3">
          <UserAvatar name="RetroFlow" avatar="RF" size="lg" className="mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Retrospectives Linked Yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Schedule a retrospective session for this project to start gathering team feedback and generating action items.
          </p>
          {canManageProject && (
            <button
              type="button"
              onClick={onCreateRetroClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold transition-colors shadow-md shadow-[#5cb028]/20 cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a] dark:shadow-[#88c958]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Retrospective</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-4.5 2xl:gap-5 min-h-[190px]">
            {isLoadingRetros ? (
              Array.from({
                length: Math.min(
                  ITEMS_PER_PAGE,
                  Math.max(paginationMeta.totalItems || 3, 3)
                ),
              }).map((_, idx) => (
                <RetroCardSkeleton key={`skeleton-${idx}`} />
              ))
            ) : (
              paginatedRetros.map((retro) => (
                <RetroCard
                  key={retro.id || retro.shareToken}
                  retro={retro}
                  canManageProject={canManageProject}
                  isCopied={copiedToken === retro.shareToken}
                  onShare={handleShareClick}
                  onEdit={handleOpenEdit}
                  onDelete={(r) => setDeletingRetro(r)}
                />
              ))
            )}
          </div>

          <RetrosPagination
            currentPage={currentPage}
            totalPages={paginationMeta.totalPages}
            startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
            endIndex={Math.min(currentPage * ITEMS_PER_PAGE, paginationMeta.totalItems)}
            totalItems={paginationMeta.totalItems}
            onPageChange={(p) => setCurrentPage(p)}
            isLoading={isLoadingRetros}
          />
        </div>
      )}

      {canManageProject && (
        <ShareInviteModal
          isOpen={Boolean(invitingSession)}
          onClose={() => setInvitingSession(null)}
          session={invitingSession}
        />
      )}

      <CustomizeRetroModal
        isOpen={isCustomizeOpen}
        onClose={() => {
          setIsCustomizeOpen(false);
          setEditingBoard(null);
        }}
        onSave={handleSaveCustomize}
        initialData={editingBoard}
        projectContext={{
          id: project.id,
          name: project.name,
          key: project.key,
          sprintName: editingBoard?.sprintName || `Sprint ${project.retrospectives?.length || 0}`,
          members: project.members || [],
        }}
      />

      <DeleteRetroModal
        retro={deletingRetro}
        isDeleting={isDeleting}
        onClose={() => setDeletingRetro(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default RetrosTab;
