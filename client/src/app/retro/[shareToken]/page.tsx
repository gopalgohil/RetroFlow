'use client';

import React, { useState, use } from 'react';
import { useRetroSession } from '@/hooks/useRetroSession';
import {
  RetroHeader,
  RetroColumn,
  ParticipantNameModal,
  RetroNotFound,
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
        onToggleReveal={() => session.setIsRevealed((prev) => !prev)}
        onOpenInvite={() => setIsInviteModalOpen(true)}
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
            />
          ))}
        </div>
      </main>

      {/* 3. Guest Developer Display Name Prompt Dialog */}
      <ParticipantNameModal
        isOpen={session.isNamePromptOpen}
        onJoin={session.setGuestName}
        verifiedEmail={session.verifiedGuestEmail}
      />

      {/* 4. Team Share & Email Invite Modal */}
      <ShareInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        session={session.retro}
      />
    </div>
  );
}
