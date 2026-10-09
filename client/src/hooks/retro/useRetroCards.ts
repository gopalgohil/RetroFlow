'use client';

import { useCallback, MutableRefObject } from 'react';
import { api, ENDPOINTS } from '@/lib/api';
import { getRetroSocket } from '@/lib/socket';
import { StickyCard } from '@/types/retro';

export interface UseRetroCardsParams {
  shareToken: string;
  currentAuthorName: string;
  participantName: string;
  canMoveCrossColumn: boolean;
  cardsRef: MutableRefObject<StickyCard[]>;
  currentUserRef: MutableRefObject<any>;
  setCards: React.Dispatch<React.SetStateAction<StickyCard[]>>;
  setRemainingVotes: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Modular Hook: useRetroCards
 * Encapsulates card CRUD actions, optimistic updates, and REST fallbacks
 */
export function useRetroCards({
  shareToken,
  currentAuthorName,
  participantName,
  canMoveCrossColumn,
  cardsRef,
  currentUserRef,
  setCards,
  setRemainingVotes,
}: UseRetroCardsParams) {
  const addCard = useCallback(
    async (topicId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !shareToken) return;

      const token = typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null;
      const payload = {
        shareToken,
        topicId,
        text: trimmed,
        author: currentAuthorName,
        authorEmail: currentUserRef.current?.email || '',
        token,
      };

      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit('card:add', payload);
      } else {
        try {
          const res = await api.post(`${ENDPOINTS.RETROS}/${shareToken}/cards`, payload);
          if (res.data) {
            const c = res.data;
            setCards((prev) => [
              ...prev,
              {
                id: c.cardId || c.id,
                cardId: c.cardId || c.id,
                topicId: c.topicId,
                text: c.text,
                author: c.author,
                authorEmail: c.authorEmail,
                votes: typeof c.votes === 'number' ? c.votes : 0,
                voters: Array.isArray(c.voters) ? c.voters : [],
              },
            ]);
          }
        } catch (err) {
          console.error('[RetroSession] Failed to add card:', err);
        }
      }
    },
    [shareToken, currentAuthorName, currentUserRef, setCards]
  );

  const updateCard = useCallback(
    async (cardId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !shareToken) return;

      // Optimistic Update
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, text: trimmed } : c))
      );

      const token = typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null;
      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit(
          'card:edit',
          {
            shareToken,
            cardId,
            text: trimmed,
            token,
          },
          (res: any) => {
            if (res?.error) {
              console.warn('[RetroSession] Failed to update card:', res.error);
            }
          }
        );
      } else {
        try {
          await api.put(`${ENDPOINTS.RETROS}/${shareToken}/cards/${cardId}`, {
            text: trimmed,
          });
        } catch (err) {
          console.error('[RetroSession] Failed to update card:', err);
        }
      }
    },
    [shareToken, setCards]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!shareToken) return;

      // Optimistic Removal
      setCards((prev) => prev.filter((c) => c.id !== cardId));

      const token = typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null;
      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit(
          'card:delete',
          {
            shareToken,
            cardId,
            token,
          },
          (res: any) => {
            if (res?.error) {
              console.warn('[RetroSession] Failed to delete card:', res.error);
            }
          }
        );
      } else {
        try {
          await api.delete(`${ENDPOINTS.RETROS}/${shareToken}/cards/${cardId}`);
        } catch (err) {
          console.error('[RetroSession] Failed to delete card:', err);
        }
      }
    },
    [shareToken, setCards]
  );

  const moveCard = useCallback(
    async (cardId: string, targetTopicId: string) => {
      if (!shareToken || !cardId || !targetTopicId) return;

      if (!canMoveCrossColumn) {
        console.warn('[RetroSession] Permission denied: Only Admin and Manager can move cards across questions.');
        return;
      }

      // Optimistic move in local state
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, topicId: targetTopicId } : c))
      );

      const token = typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null;
      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit('card:move', {
          shareToken,
          cardId,
          targetTopicId,
          token,
        });
      } else {
        try {
          await api.put(`${ENDPOINTS.RETROS}/${shareToken}/cards/${cardId}/move`, {
            topicId: targetTopicId,
          });
        } catch (err) {
          console.error('[RetroSession] Failed to move card:', err);
        }
      }
    },
    [shareToken, canMoveCrossColumn, setCards]
  );

  const reorderCards = useCallback(
    async (topicId: string, cardIds: string[]) => {
      if (!shareToken || !topicId || !Array.isArray(cardIds)) return;

      if (!canMoveCrossColumn) {
        console.warn('[RetroSession] Permission denied: Only Admin and Manager can reorder cards.');
        return;
      }

      setCards((prev) => {
        const thisTopicCards = prev.filter((c) => c.topicId === topicId);
        const cardMap = new Map(thisTopicCards.map((c) => [c.id, c]));
        const reorderedTopicCards = cardIds
          .map((id) => cardMap.get(id))
          .filter(Boolean) as StickyCard[];

        thisTopicCards.forEach((c) => {
          if (!cardIds.includes(c.id)) {
            reorderedTopicCards.push(c);
          }
        });

        let topicIdx = 0;
        return prev.map((c) => {
          if (c.topicId === topicId) {
            return reorderedTopicCards[topicIdx++] || c;
          }
          return c;
        });
      });

      const token = typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null;
      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit('cards:reorder', {
          shareToken,
          topicId,
          cardIds,
          token,
        });
      } else {
        try {
          await api.put(`${ENDPOINTS.RETROS}/${shareToken}/topics/${topicId}/reorder-cards`, {
            cardIds,
          });
        } catch (err) {
          console.error('[RetroSession] Failed to reorder cards:', err);
        }
      }
    },
    [shareToken, canMoveCrossColumn, setCards]
  );

  const voteCard = useCallback(
    async (cardId: string) => {
      if (!shareToken) return;

      const currentCards = cardsRef.current;
      const targetCard = currentCards.find((c) => c.id === cardId);
      if (!targetCard) return;

      const user = currentUserRef.current;
      const voterIdentifier = user?.name || participantName || 'Developer';
      const isCurrentlyVoted =
        Boolean(targetCard.hasVoted) ||
        (Array.isArray(targetCard.voters) &&
          targetCard.voters.some((v) => {
            const vLower = (v || '').toLowerCase().trim();
            return (
              (user?.email && vLower === user.email.toLowerCase().trim()) ||
              (user?.email && vLower.includes(user.email.toLowerCase().trim())) ||
              (voterIdentifier && vLower === voterIdentifier.toLowerCase().trim())
            );
          }));

      const willBeVoted = !isCurrentlyVoted;

      // Optimistic Like / Unlike Toggle
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === cardId) {
            let updatedVoters = Array.isArray(c.voters) ? [...c.voters] : [];
            const voterToken = user?.email || voterIdentifier;
            if (willBeVoted) {
              if (!updatedVoters.some((v) => (v || '').toLowerCase().trim() === voterToken.toLowerCase().trim())) {
                updatedVoters.push(voterToken);
              }
            } else {
              updatedVoters = updatedVoters.filter((v) => {
                const vLower = (v || '').toLowerCase().trim();
                return (
                  (!user?.email || (vLower !== user.email.toLowerCase().trim() && !vLower.includes(user.email.toLowerCase().trim()))) &&
                  (!voterIdentifier || vLower !== voterIdentifier.toLowerCase().trim())
                );
              });
            }

            const newVoteCount = willBeVoted
              ? (c.votes || 0) + 1
              : Math.max(0, (c.votes || 1) - 1);

            return {
              ...c,
              votes: newVoteCount,
              voters: updatedVoters,
              hasVoted: willBeVoted,
            };
          }
          return c;
        })
      );

      setRemainingVotes((prev) => (willBeVoted ? Math.max(0, prev - 1) : Math.min(1, prev + 1)));

      const token = typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null;
      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit(
          'card:vote',
          {
            shareToken,
            cardId,
            voter: voterIdentifier,
            voterEmail: user?.email || '',
            token,
          },
          (res: any) => {
            if (res?.error) {
              console.warn('[RetroSession] Server rejected vote:', res.error);
              setCards((prev) =>
                prev.map((c) => {
                  if (c.id === cardId) {
                    return {
                      ...c,
                      votes: isCurrentlyVoted ? (c.votes || 0) + 1 : Math.max(0, (c.votes || 1) - 1),
                      hasVoted: isCurrentlyVoted,
                    };
                  }
                  return c;
                })
              );
              setRemainingVotes(isCurrentlyVoted ? 0 : 1);
            }
          }
        );
      } else {
        try {
          await api.post(`${ENDPOINTS.RETROS}/${shareToken}/cards/${cardId}/vote`, {
            voter: voterIdentifier,
            voterEmail: user?.email || '',
          });
        } catch (err) {
          console.error('[RetroSession] Failed to toggle vote on card:', err);
          setCards((prev) =>
            prev.map((c) => {
              if (c.id === cardId) {
                return {
                  ...c,
                  votes: isCurrentlyVoted ? (c.votes || 0) + 1 : Math.max(0, (c.votes || 1) - 1),
                  hasVoted: isCurrentlyVoted,
                };
              }
              return c;
            })
          );
          setRemainingVotes(isCurrentlyVoted ? 0 : 1);
        }
      }
    },
    [shareToken, participantName, cardsRef, currentUserRef, setCards, setRemainingVotes]
  );

  return {
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCards,
    voteCard,
  };
}

export default useRetroCards;
