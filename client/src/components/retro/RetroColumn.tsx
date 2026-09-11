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

  const ColumnIcon = ICON_MAP[topic.icon] || Smile;

  const handleSubmitCard = () => {
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
  };

  const handleCardDragOver = (targetCardId: string, e: React.DragEvent) => {
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

    // STRICT SCOPING: Reject drop if not from the exact same topic/question
    if (sourceTopicId !== topic.topicId || !sourceCardId || sourceCardId === targetCardId) {
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

      {/* Sticky Cards Scrollable List */}
      <div className="p-2 sm:p-2.5 space-y-2 min-h-[220px] max-h-[calc(100vh-230px)] overflow-y-auto">
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
            isDragTarget={dragTargetId === card.id}
            dropPosition={dragTargetId === card.id ? dropPosition : null}
            onVote={onVoteCard}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
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
        {isInputOpen && (
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

      {/* Bottom Column "+ Add Card" Trigger */}
      <div className="p-2 border-t border-slate-100 bg-white">
        <button
          onClick={() => setIsInputOpen(true)}
          className="w-full py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Card</span>
        </button>
      </div>
    </div>
  );
});

export default RetroColumn;
