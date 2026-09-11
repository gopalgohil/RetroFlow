'use client';

import React, { useState, memo } from 'react';
import { Pencil, Trash2, Check, X, ThumbsUp, GripVertical } from 'lucide-react';
import { StickyCard } from '@/types/retro';

export interface RetroCardItemProps {
  card: StickyCard;
  topicColor: string;
  isRevealed: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isCurrentAuthor: boolean;
  currentAuthorName?: string;
  remainingVotes: number;
  isFirstCard?: boolean;
  isDragTarget?: boolean;
  dropPosition?: 'above' | 'below' | null;
  onVote: (cardId: string) => void;
  onUpdate: (cardId: string, text: string) => void;
  onDelete: (cardId: string) => void;
  onCardDragStart?: (cardId: string, e: React.DragEvent) => void;
  onCardDragEnd?: () => void;
  onCardDragOver?: (cardId: string, e: React.DragEvent) => void;
  onCardDragLeave?: (cardId: string, e: React.DragEvent) => void;
  onCardDrop?: (cardId: string, e: React.DragEvent) => void;
}

/**
 * Highly reusable Sticky Card Component
 * Features:
 * - 1-vote limit per user/developer/admin
 * - ThumbsUp icon for voting
 * - Voters popover on thumb hover showing list of voters with avatars (like Metro Retro/TeamRetro)
 * - Author name hidden by default, smoothly revealed only when hovering over the card
 */
export const RetroCardItem: React.FC<RetroCardItemProps> = memo(function RetroCardItem({
  card,
  topicColor,
  isRevealed,
  canEdit,
  canDelete,
  isCurrentAuthor,
  currentAuthorName,
  remainingVotes,
  isFirstCard = false,
  isDragTarget = false,
  dropPosition = null,
  onVote,
  onUpdate,
  onDelete,
  onCardDragStart,
  onCardDragEnd,
  onCardDragOver,
  onCardDragLeave,
  onCardDrop,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(card.text);
  const [isDragging, setIsDragging] = useState(false);

  const handleStartEdit = () => {
    setEditText(card.text);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditText(card.text);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onUpdate(card.id, trimmed);
    setIsEditing(false);
  };

  const canInteract = card.hasVoted || remainingVotes > 0;

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => {
        if (isEditing) return;
        setIsDragging(true);
        if (onCardDragStart) {
          onCardDragStart(card.id, e);
        } else {
          e.dataTransfer.setData('text/plain', card.id);
          e.dataTransfer.setData(
            'application/json',
            JSON.stringify({ cardId: card.id, topicId: card.topicId })
          );
          e.dataTransfer.effectAllowed = 'move';
        }
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onCardDragEnd?.();
      }}
      onDragOver={(e) => onCardDragOver?.(card.id, e)}
      onDragLeave={(e) => onCardDragLeave?.(card.id, e)}
      onDrop={(e) => onCardDrop?.(card.id, e)}
      style={{
        backgroundColor: `${topicColor}08`,
        borderColor: `${topicColor}30`,
        borderLeftColor: topicColor,
      }}
      className={`group relative p-2.5 rounded-xl border border-l-[3.5px] shadow-2xs hover:shadow-xs transition-all space-y-2 hover:z-30 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 ring-1 ring-indigo-400/40' : ''
      } ${
        !isRevealed ? 'filter blur-xs select-none' : ''
      }`}
    >
      {/* Precision Drop Insertion Line (Zero Layout Shift) */}
      {isDragTarget && dropPosition === 'above' && (
        <div className="absolute -top-1 left-1.5 right-1.5 h-[2.5px] rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)] z-30 pointer-events-none animate-pulse" />
      )}
      {isDragTarget && dropPosition === 'below' && (
        <div className="absolute -bottom-1 left-1.5 right-1.5 h-[2.5px] rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)] z-30 pointer-events-none animate-pulse" />
      )}
      {isEditing ? (
        <div className="space-y-2 animate-in fade-in duration-150">
          <textarea
            autoFocus
            rows={2}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveEdit();
              } else if (e.key === 'Escape') {
                handleCancelEdit();
              }
            }}
            className="w-full text-xs text-slate-800 p-2 rounded-lg border border-indigo-400 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner"
            placeholder="Update your feedback..."
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Row: Vote Action + Management Actions */}
          <div className="flex items-center justify-between gap-1">
            {/* ThumbsUp Voting Button with Hover Voters Popover */}
            <div className="relative group/vote-popover">
              <button
                type="button"
                onClick={() => canInteract && onVote(card.id)}
                disabled={!card.hasVoted && remainingVotes <= 0}
                title={
                  card.hasVoted
                    ? 'You liked this thought. Click to unlike'
                    : remainingVotes <= 0
                    ? 'No votes remaining'
                    : 'Click to like this thought (1 vote limit)'
                }
                style={{
                  color: card.hasVoted ? '#ffffff' : topicColor,
                  backgroundColor: card.hasVoted ? topicColor : `${topicColor}15`,
                  borderColor: card.hasVoted ? topicColor : `${topicColor}30`,
                }}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all shadow-2xs ${
                  !card.hasVoted && remainingVotes <= 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95 cursor-pointer'
                }`}
              >
                <ThumbsUp className={`w-3 h-3 ${card.hasVoted ? 'fill-current' : ''}`} />
                <span>{card.votes || 0}</span>
              </button>

              {/* Voters List Popover on Thumb Hover (Opens downwards for first card to prevent top container clipping) */}
              <div
                className={`absolute left-0 ${
                  isFirstCard ? 'top-full mt-1.5' : 'bottom-full mb-2'
                } hidden group-hover/vote-popover:flex flex-col z-50 bg-white rounded-xl shadow-xl border border-slate-200/90 p-2.5 min-w-[160px] max-w-[240px] pointer-events-auto animate-in fade-in zoom-in-95 duration-150`}
              >
                {/* Visual tooltip caret arrow */}
                {isFirstCard ? (
                  <div className="absolute -top-1 left-3 w-2 h-2 bg-white border-t border-l border-slate-200 rotate-45" />
                ) : (
                  <div className="absolute -bottom-1 left-3 w-2 h-2 bg-white border-b border-r border-slate-200 rotate-45" />
                )}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-indigo-600" />
                    <span>Votes</span>
                  </span>
                  <span className="font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-full text-[9px]">
                    {card.votes || 0}
                  </span>
                </div>

                {card.voters && card.voters.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                    {card.voters.map((voter, idx) => {
                      const cleanName = voter.trim();
                      const initials =
                        cleanName.length > 3 ? cleanName.slice(0, 3) : cleanName;
                      const isMe =
                        currentAuthorName &&
                        cleanName.toLowerCase() === currentAuthorName.toLowerCase();

                      const bgGradients = [
                        'from-sky-500 to-blue-600',
                        'from-indigo-500 to-violet-600',
                        'from-emerald-500 to-teal-600',
                        'from-amber-500 to-orange-600',
                        'from-rose-500 to-pink-600',
                      ];
                      const gradientClass = bgGradients[idx % bgGradients.length];

                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${gradientClass} text-white flex items-center justify-center font-bold text-[9px] shrink-0 shadow-2xs capitalize`}
                          >
                            {initials}
                          </div>
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            {cleanName}
                            {isMe && (
                              <span className="text-[10px] text-indigo-600 font-bold ml-1">
                                (You)
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 py-1 italic">
                    No votes yet. Click thumb to vote!
                  </div>
                )}

                {card.hasVoted && (
                  <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] font-semibold text-emerald-600 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>You liked this</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-normal">Click to unlike</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Drag Handle */}
              <div
                className="text-slate-300 group-hover:text-slate-500 hover:text-indigo-600 transition-colors cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-black/5"
                title="Drag to reorder card"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              {/* Edit (Author Only) & Delete (Author or Facilitator Moderation) */}
              {(canEdit || canDelete) && (
                <div className="flex items-center gap-0.5">
                  {canEdit && (
                    <button
                      onClick={handleStartEdit}
                      title="Edit your thought"
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(card.id)}
                      title={canEdit ? 'Delete your thought' : 'Moderate / Delete thought'}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card Body Text */}
          <p className="text-xs text-slate-800 leading-snug break-words font-medium py-0.5">
            {card.text}
          </p>

          {/* Card Author Attribution: Completely hidden by default, smoothly revealed on mouse hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-1.5 border-t border-slate-200/40 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[8px] uppercase shrink-0">
                {card.author ? card.author.slice(0, 2) : 'RF'}
              </div>
              <span className="truncate font-medium">by {card.author}</span>
            </div>
            {isCurrentAuthor && (
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 shrink-0">
                You
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export default RetroCardItem;

