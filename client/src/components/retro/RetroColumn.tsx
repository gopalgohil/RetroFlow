'use client';

import React, { useState, memo } from 'react';
import {
  Smile,
  Frown,
  Lightbulb,
  Puzzle,
  Rocket,
  Anchor,
  Target,
  Flag,
  Plus,
  Sparkles,
  Lock,
} from 'lucide-react';
import { RetroTopic, StickyCard } from '@/types/retro';
import { RetroCardItem } from './RetroCardItem';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  smile: Smile,
  frown: Frown,
  bulb: Lightbulb,
  puzzle: Puzzle,
  rocket: Rocket,
  anchor: Anchor,
  target: Target,
  flag: Flag,
};

export interface RetroColumnProps {
  topic: RetroTopic;
  cards: StickyCard[];
  isRevealed: boolean;
  remainingVotes: number;
  currentAuthorName: string;
  canManageActionItems?: boolean;
  canMoveCrossColumn?: boolean;
  activeDragTopicId?: string | null;
  onDragCardStart?: (cardId: string, topicId: string) => void;
  onDragCardEnd?: () => void;
  onCrossColumnRejected?: () => void;
  actionTopicId?: string;
  canEditCard: (card: StickyCard) => boolean;
  canDeleteCard: (card: StickyCard) => boolean;
  onAddCard: (topicId: string, text: string) => void;
  onUpdateCard: (cardId: string, text: string) => void;
  onDeleteCard: (cardId: string) => void;
  onVoteCard: (cardId: string) => void;
  onMoveCard?: (cardId: string, targetTopicId: string) => void;
  onReorderCards?: (topicId: string, cardIds: string[]) => void;
  onExportTopic?: () => void;
}

/**
 * Reusable Retrospective Topic Column
 * Handles card grouping, column headers, and inline feedback contribution.
 */
export const RetroColumn: React.FC<RetroColumnProps> = memo(function RetroColumn({
  topic,
  cards,
  isRevealed,
  remainingVotes,
  currentAuthorName,
  canManageActionItems = false,
  canMoveCrossColumn = true,
  activeDragTopicId = null,
  onDragCardStart,
  onDragCardEnd,
  onCrossColumnRejected,
  actionTopicId,
  canEditCard,
  canDeleteCard,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onVoteCard,
  onMoveCard,
  onReorderCards,
  onExportTopic,
}) {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [cardText, setCardText] = useState('');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);
  const [isColumnDragOver, setIsColumnDragOver] = useState(false);

  const isActionColumn =
    (topic.title || '').toLowerCase().includes('action') ||
    topic.icon === 'target' ||
    (topic.topicId && topic.topicId.toLowerCase().includes('action'));

  const canAddCard = !isActionColumn || Boolean(canManageActionItems);

  const ColumnIcon = ICON_MAP[topic.icon] || Smile;

  const isDraggingFromAnotherColumn = Boolean(
    activeDragTopicId && activeDragTopicId !== topic.topicId
  );

  const handleSubmitCard = () => {
    if (!canAddCard) return;
    const trimmed = cardText.trim();
    if (!trimmed) return;
    onAddCard(topic.topicId, trimmed);
    setCardText('');
    setIsInputOpen(false);
  };

  const handleCancelInput = () => {
    setCardText('');
    setIsInputOpen(false);
  };

  const handleCardDragStart = (cardId: string, e: React.DragEvent) => {
    setDraggedCardId(cardId);
    onDragCardStart?.(cardId, topic.topicId);
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ cardId, topicId: topic.topicId })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragEnd = () => {
    setDraggedCardId(null);
    setDragTargetId(null);
    setDropPosition(null);
    setIsColumnDragOver(false);
    onDragCardEnd?.();
  };

  const handleCardDragOver = (targetCardId: string, e: React.DragEvent) => {
    // If dragging from another question and user is not Admin/Manager: reject drag hover
    if (isDraggingFromAnotherColumn && !canMoveCrossColumn) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'none';
      if (dragTargetId !== null) {
        setDragTargetId(null);
        setDropPosition(null);
      }
      return;
    }

    if (!draggedCardId || draggedCardId === targetCardId) {
      if (dragTargetId !== null) {
        setDragTargetId(null);
        setDropPosition(null);
      }
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const isTopHalf = offset < rect.height / 2;
    const pos = isTopHalf ? 'above' : 'below';

    if (dragTargetId !== targetCardId || dropPosition !== pos) {
      setDragTargetId(targetCardId);
      setDropPosition(pos);
    }
  };

  const handleCardDragLeave = (targetCardId: string, e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragTargetId === targetCardId) {
      setDragTargetId(null);
      setDropPosition(null);
    }
  };

  const handleCardDrop = (targetCardId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsColumnDragOver(false);

    let sourceCardId = draggedCardId;
    let sourceTopicId = topic.topicId;

    try {
      const jsonStr = e.dataTransfer.getData('application/json');
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.cardId) sourceCardId = parsed.cardId;
        if (parsed.topicId) sourceTopicId = parsed.topicId;
      }
    } catch {
      // fallback
    }

    if (!sourceCardId) {
      handleCardDragEnd();
      return;
    }

    // Cross-column drop into this column:
    if (sourceTopicId !== topic.topicId) {
      // Strictly Admin and Manager only: block cross-question move for regular team members
      if (!canMoveCrossColumn) {
        onCrossColumnRejected?.();
        handleCardDragEnd();
        return;
      }
      // If target column is Action Items and user is NOT Admin/Manager: reject!
      if (isActionColumn && !canManageActionItems) {
        handleCardDragEnd();
        return;
      }
      onMoveCard?.(sourceCardId, topic.topicId);
      handleCardDragEnd();
      return;
    }

    // Same-column reordering:
    if (sourceCardId === targetCardId) {
      handleCardDragEnd();
      return;
    }

    const currentCards = [...cards];
    const sourceIdx = currentCards.findIndex((c) => c.id === sourceCardId);
    const targetIdx = currentCards.findIndex((c) => c.id === targetCardId);

    if (sourceIdx === -1 || targetIdx === -1) {
      handleCardDragEnd();
      return;
    }

    const [movedCard] = currentCards.splice(sourceIdx, 1);
    let insertIdx = currentCards.findIndex((c) => c.id === targetCardId);
    if (dropPosition === 'below') {
      insertIdx += 1;
    }

    currentCards.splice(insertIdx, 0, movedCard);
    const newCardIds = currentCards.map((c) => c.id);

    handleCardDragEnd();
    onReorderCards?.(topic.topicId, newCardIds);
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    // If dragging from another question and user is not Admin/Manager: reject drop effect
    if (isDraggingFromAnotherColumn && !canMoveCrossColumn) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'none';
      if (isColumnDragOver) setIsColumnDragOver(false);
      return;
    }
    if (isActionColumn && !canManageActionItems) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isColumnDragOver) setIsColumnDragOver(true);
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsColumnDragOver(false);
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsColumnDragOver(false);

    let sourceCardId = draggedCardId;
    let sourceTopicId = topic.topicId;

    try {
      const jsonStr = e.dataTransfer.getData('application/json');
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.cardId) sourceCardId = parsed.cardId;
        if (parsed.topicId) sourceTopicId = parsed.topicId;
      }
    } catch {}

    if (!sourceCardId) {
      handleCardDragEnd();
      return;
    }

    if (sourceTopicId !== topic.topicId) {
      // Strictly Admin and Manager only: block cross-question move for regular team members
      if (!canMoveCrossColumn) {
        onCrossColumnRejected?.();
        handleCardDragEnd();
        return;
      }
      if (isActionColumn && !canManageActionItems) {
        handleCardDragEnd();
        return;
      }
      onMoveCard?.(sourceCardId, topic.topicId);
    }
    handleCardDragEnd();
  };

  return (
    <div className="flex-1 min-w-[220px] rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-xs flex flex-col overflow-hidden transition-all">
      {/* Column Top Accent Header */}
      <div
        style={{
          backgroundColor: `${topic.color}15`,
          borderBottomColor: `${topic.color}30`,
        }}
        className="px-3 py-2.5 border-b space-y-0.5"
      >
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              style={{ backgroundColor: topic.color }}
              className="w-6 h-6 rounded-lg text-white flex items-center justify-center shadow-2xs shrink-0"
            >
              <ColumnIcon className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 truncate">
              {topic.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onExportTopic && cards.length > 0 && topic.title.toLowerCase().includes('action') && (
              <button
                type="button"
                onClick={onExportTopic}
                title="Select action items and push directly to sprint backlog"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-2xs transition-all hover:scale-[1.03] cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>To Sprint</span>
              </button>
            )}
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/90 text-slate-600 border border-slate-200 shrink-0">
              {cards.length}
            </span>
          </div>
        </div>
        {topic.description && (
          <p className="text-[10px] text-slate-500 leading-tight pl-8 truncate">
            {topic.description}
          </p>
        )}
      </div>

      {/* Sticky Cards Scrollable List with Column-level Drop Zone */}
      <div
        onDragOver={handleColumnDragOver}
        onDragLeave={handleColumnDragLeave}
        onDrop={handleColumnDrop}
        className={`p-2 sm:p-2.5 space-y-2 min-h-[220px] max-h-[calc(100vh-230px)] overflow-y-auto transition-colors ${
          isColumnDragOver && (canManageActionItems || !isActionColumn) && (!isDraggingFromAnotherColumn || canMoveCrossColumn)
            ? 'bg-indigo-50/50 ring-2 ring-indigo-400/70 ring-inset rounded-xl'
            : ''
        }`}
      >
        {cards.map((card, idx) => (
          <RetroCardItem
            key={card.id}
            card={card}
            isFirstCard={idx === 0}
            topicColor={topic.color}
            isRevealed={isRevealed}
            canEdit={canEditCard(card)}
            canDelete={canDeleteCard(card)}
            isCurrentAuthor={card.author === currentAuthorName}
            currentAuthorName={currentAuthorName}
            remainingVotes={remainingVotes}
            canMoveCrossColumn={canMoveCrossColumn}
            isDragTarget={dragTargetId === card.id}
            dropPosition={dragTargetId === card.id ? dropPosition : null}
            onVote={onVoteCard}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
            onMoveToActions={
              !isActionColumn && canManageActionItems && actionTopicId && onMoveCard
                ? () => onMoveCard(card.id, actionTopicId)
                : undefined
            }
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
            onCardDragOver={handleCardDragOver}
            onCardDragLeave={handleCardDragLeave}
            onCardDrop={handleCardDrop}
          />
        ))}

        {cards.length === 0 && !isInputOpen && (
          <div className="py-8 text-center text-slate-400 text-[11px] italic">
            No cards added yet.
          </div>
        )}

        {/* Inline Add Card Input Form */}
        {isInputOpen && canAddCard && (
          <div className="p-2.5 rounded-xl bg-white border-2 border-indigo-500 shadow-sm space-y-2 animate-in fade-in duration-150">
            <textarea
              autoFocus
              rows={2}
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitCard();
                } else if (e.key === 'Escape') {
                  handleCancelInput();
                }
              }}
              placeholder="Write a thought or feedback..."
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleCancelInput}
                className="px-2 py-0.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitCard}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                Add Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Column "+ Add Card" Trigger or Locked State */}
      <div className="p-2 border-t border-slate-100 bg-white">
        {canAddCard ? (
          <button
            type="button"
            onClick={() => setIsInputOpen(true)}
            className="w-full py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>
        ) : (
          <div
            title="Action Items can only be added by Managers or Admins"
            className="w-full py-2 px-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Only Managers & Admins can add Action Items</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default RetroColumn;
