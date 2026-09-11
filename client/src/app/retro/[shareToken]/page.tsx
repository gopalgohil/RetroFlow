'use client';

import React, { useState, use } from 'react';
import { useRetroSession } from '@/hooks/useRetroSession';
import {
  RetroHeader,
  RetroColumn,
  ParticipantNameModal,
  RetroNotFound,
  EndSessionExportModal,
} from '@/components/retro';
import { ShareInviteModal } from '@/components/dashboard/ShareInviteModal';
import { RetroBoardSkeleton } from '@/components/dashboard';

/**
 * Senior Staff Engineer Standard Retrospective Page
 * Declarative, pure compositional architecture with dedicated custom hook & modular children.
 */
export default function LiveRetroBoardPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = use(params);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);
  const [exportModalMode, setExportModalMode] = useState<'export_only' | 'end_and_export'>('end_and_export');

  // Encapsulates all DB persistence, Socket.io lifecycle, Identity & Role logic
  const session = useRetroSession(shareToken);

  if (session.isLoading) {
    return <RetroBoardSkeleton />;
  }

  if (session.error || !session.retro) {
    return <RetroNotFound error={session.error} isFacilitator={session.isFacilitator} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Modular Session Navigation Header */}
      <RetroHeader
        title={session.retro.title}
        description={session.retro.description}
        isFacilitator={session.isFacilitator}
        currentAuthorName={session.currentAuthorName}
        remainingVotes={session.remainingVotes}
        isRevealed={session.isRevealed}
        revealMode={session.retro.revealMode}
        socketConnected={session.socketConnected}
        verifiedGuestEmail={session.verifiedGuestEmail}
        projectId={session.retro.projectId}
        projectKey={session.retro.projectKey}
        sprintName={session.retro.sprintName}
        userRole={session.currentUser?.role}
        onToggleReveal={() => session.setIsRevealed((prev) => !prev)}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        onEndSession={
          session.canExportToSprint
            ? () => {
                setExportModalMode('end_and_export');
                setIsEndSessionModalOpen(true);
              }
            : undefined
        }
      />

      {/* 2. Responsive Retrospective Columns Board Canvas */}
      <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-x-auto w-full">
        <div className="flex gap-3 sm:gap-4 items-start w-full min-w-max md:min-w-0 pb-6">
          {session.retro.topics?.map((topic) => (
            <RetroColumn
              key={topic.topicId}
              topic={topic}
              cards={session.cards.filter((c) => c.topicId === topic.topicId)}
              isRevealed={session.isRevealed}
              remainingVotes={session.remainingVotes}
              currentAuthorName={session.currentAuthorName}
              canEditCard={session.canEditCard}
              canDeleteCard={session.canDeleteCard}
              onAddCard={session.addCard}
              onUpdateCard={session.updateCard}
              onDeleteCard={session.deleteCard}
              onVoteCard={session.voteCard}
              onMoveCard={session.moveCard}
              onExportTopic={
                session.canExportToSprint
                  ? () => {
                      setExportModalMode('export_only');
                      setIsEndSessionModalOpen(true);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </main>

      {/* 3. Guest Developer Display Name Prompt Dialog */}
      <ParticipantNameModal
        isOpen={session.isNamePromptOpen}
        onJoin={(name, email) => session.setGuestName(name, email)}
        verifiedEmail={session.verifiedGuestEmail}
      />

      {/* 4. Team Share & Email Invite Modal (Facilitator / Admin / Manager only) */}
      {session.isFacilitator && (
        <ShareInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          session={session.retro}
        />
      )}

      {/* 5. End Session & Action Items Export to Sprint Modal */}
      <EndSessionExportModal
        isOpen={isEndSessionModalOpen}
        onClose={() => setIsEndSessionModalOpen(false)}
        retroId={session.retro._id}
        retroTitle={session.retro.title}
        cards={session.cards}
        topics={session.retro.topics}
        projectId={session.retro.projectId}
        projectKey={session.retro.projectKey}
        sprintId={session.retro.sprintId}
        sprintName={session.retro.sprintName}
        mode={exportModalMode}
        canExport={session.canExportToSprint}
      />
    </div>
  );
}
