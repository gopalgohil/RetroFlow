'use client';

import React, { useState, memo } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { StickyCard } from '@/types/retro';

export interface RetroCardItemProps {
  card: StickyCard;
  topicColor: string;
  isRevealed: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isCurrentAuthor: boolean;
  remainingVotes: number;
  onVote: (cardId: string) => void;
  onUpdate: (cardId: string, text: string) => void;
  onDelete: (cardId: string) => void;
}

/**
 * Highly reusable Sticky Card Component
 * Manages its own localized editing state to prevent re-render cascading across the board.
 */
export const RetroCardItem: React.FC<RetroCardItemProps> = memo(function RetroCardItem({
  card,
  topicColor,
  isRevealed,
  canEdit,
  canDelete,
  isCurrentAuthor,
  remainingVotes,
  onVote,
  onUpdate,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(card.text);

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

  return (
    <div
      style={{
        backgroundColor: `${topicColor}08`,
        borderColor: `${topicColor}30`,
        borderLeftColor: topicColor,
      }}
      className={`p-2.5 rounded-xl border border-l-[3.5px] shadow-2xs hover:shadow-xs transition-all space-y-2 ${
        !isRevealed ? 'filter blur-xs select-none' : ''
      }`}
    >
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
            <button
              onClick={() => onVote(card.id)}
              disabled={remainingVotes <= 0}
              title="Vote on this thought"
              style={{
                color: card.hasVoted ? '#ffffff' : topicColor,
                backgroundColor: card.hasVoted ? topicColor : `${topicColor}15`,
                borderColor: `${topicColor}30`,
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all active:scale-95 cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <span>⇧</span>
              <span>+{card.votes}</span>
            </button>

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

          {/* Card Body Text */}
          <p className="text-xs text-slate-800 leading-snug break-words font-medium">
            {card.text}
          </p>

          {/* Card Subtitle */}
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/40 flex items-center justify-between">
            <span className="truncate">by {card.author}</span>
            {isCurrentAuthor && (
              <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
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
