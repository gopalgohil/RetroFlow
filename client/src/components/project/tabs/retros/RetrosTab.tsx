'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Project, ProjectRetroLink } from '@/types/project';
import { RetroBoard, CreateRetroPayload } from '@/types/retro';
import { StatusPill, UserAvatar } from '@/components/ui';
import { ShareInviteModal, ShareInviteSession } from '@/components/dashboard/ShareInviteModal';
import { CustomizeRetroModal } from '@/components/dashboard/CustomizeRetroModal';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { api } from '@/lib/api';
import { RetroCard } from './RetroCard';
import { RetrosPagination } from './RetrosPagination';
import { DeleteRetroModal } from './DeleteRetroModal';

export interface RetrosTabProps {
  project: Project;
  onCreateRetroClick?: () => void;
  onProjectUpdated?: (updatedProject: Project) => void;
  canManageProject?: boolean;
}

/**
 * RetrosTab:
 * Clean, production-grade orchestrator component for project retrospectives.
 */
export const RetrosTab: React.FC<RetrosTabProps> = ({
  project,
  onCreateRetroClick,
  onProjectUpdated,
  canManageProject = true,
}) => {
  // Share / Invite State
  const [invitingSession, setInvitingSession] = useState<ShareInviteSession | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Edit Retrospective via CustomizeRetroModal (Full Builder/Customizer)
  const [editingBoard, setEditingBoard] = useState<RetroBoard | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

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

  // Open Edit Modal with full RetroBoard data
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

  // Submit Edit via PUT /api/retros/:id and project sync
  const handleSaveCustomize = async (payload: CreateRetroPayload) => {
    if (!editingBoard) return;
    const identifier = editingBoard._id || editingBoard.shareToken;

    try {
      await api.put(`/api/retros/${identifier}`, payload);
      // Synchronize full project model
      const updatedProject = await ProjectApiService.getProjectById(project.id, true);
      if (updatedProject && onProjectUpdated) {
        onProjectUpdated(updatedProject);
      }
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
      }
    } finally {
      setIsCustomizeOpen(false);
      setEditingBoard(null);
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
      {/* 1. Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-md shadow-[#5cb028]/20 transition-all hover:scale-[1.01] cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a] dark:shadow-[#88c958]/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Retrospective</span>
          </button>
        )}
      </div>

      {/* 2. Retrospectives Grid or Empty State */}
      {!project.retrospectives || project.retrospectives.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedRetros.map((retro) => (
              <RetroCard
                key={retro.id || retro.shareToken}
                retro={retro}
                canManageProject={canManageProject}
                isCopied={copiedToken === retro.shareToken}
                onShare={handleShareClick}
                onEdit={handleOpenEdit}
                onDelete={(r) => setDeletingRetro(r)}
              />
            ))}
          </div>

          {/* 3. Pagination Controls Footer (Active when > 6 retros) */}
          <RetrosPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* 4. Share / Invite Teammates Modal */}
      {canManageProject && (
        <ShareInviteModal
          isOpen={Boolean(invitingSession)}
          onClose={() => setInvitingSession(null)}
          session={invitingSession}
        />
      )}

      {/* 5. Customize & Edit Retrospective Modal (TeamRetro Builder) */}
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

      {/* 6. Delete Retrospective Confirmation Modal */}
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
