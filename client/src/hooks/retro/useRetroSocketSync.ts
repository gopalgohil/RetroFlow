'use client';

import { useState, useEffect } from 'react';
import { getRetroSocket } from '@/lib/socket';
import { StickyCard } from '@/types/retro';

export interface UseRetroSocketSyncParams {
  shareToken: string;
  currentUser: { id?: string; name?: string; email?: string; role?: string; isGuest?: boolean } | null;
  currentAuthorName: string;
  effectiveUserRole: string;
  votingLimit: number;
  setCards: React.Dispatch<React.SetStateAction<StickyCard[]>>;
  setRemainingVotes: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Modular Hook: useRetroSocketSync
 * Handles real-time WebSocket connection, subscription, and event cleanup
 */
export function useRetroSocketSync({
  shareToken,
  currentUser,
  currentAuthorName,
  effectiveUserRole,
  votingLimit,
  setCards,
  setRemainingVotes,
}: UseRetroSocketSyncParams) {
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!shareToken) return;

    const socket = getRetroSocket();

    const handleConnect = () => {
      setSocketConnected(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null;
      socket.emit(
        'join:retro',
        {
          shareToken,
          token,
          user: {
            id: currentUser?.id,
            name: currentAuthorName,
            email: currentUser?.email || '',
            role: effectiveUserRole,
          },
        },
        (response: any) => {
          if (response?.cards && Array.isArray(response.cards)) {
            setCards(
              response.cards.map((c: any) => ({
                id: c.cardId || c.id,
                cardId: c.cardId || c.id,
                topicId: c.topicId,
                text: c.text,
                author: c.author,
                authorEmail: c.authorEmail,
                votes: typeof c.votes === 'number' ? c.votes : 0,
                voters: Array.isArray(c.voters) ? c.voters : [],
                hasVoted:
                  Array.isArray(c.voters) &&
                  c.voters.some((v: string) => {
                    const vLower = (v || '').toLowerCase().trim();
                    return (
                      (currentAuthorName && vLower === currentAuthorName.toLowerCase().trim()) ||
                      (currentUser?.email && vLower === currentUser.email.toLowerCase().trim())
                    );
                  }),
                createdAt: c.createdAt,
              }))
            );
            const votedCount = response.cards.filter(
              (c: any) =>
                Array.isArray(c.voters) &&
                c.voters.some((v: string) => {
                  const vLower = (v || '').toLowerCase().trim();
                  return (
                    (currentUser?.email && vLower === currentUser.email.toLowerCase().trim()) ||
                    (currentUser?.email && vLower.includes(currentUser.email.toLowerCase().trim())) ||
                    (currentAuthorName && vLower === currentAuthorName.toLowerCase().trim())
                  );
                })
            ).length;
            setRemainingVotes(Math.max(0, votingLimit - votedCount));
          }
        }
      );
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    const handleDisconnect = () => setSocketConnected(false);
    socket.on('disconnect', handleDisconnect);

    // Event listeners
    const onCardCreated = (newCard: any) => {
      const id = newCard.cardId || newCard.id;
      setCards((prev) => {
        if (prev.some((c) => c.id === id)) return prev;
        return [
          ...prev,
          {
            id,
            cardId: id,
            topicId: newCard.topicId,
            text: newCard.text,
            author: newCard.author,
            authorEmail: newCard.authorEmail,
            votes: typeof newCard.votes === 'number' ? newCard.votes : 0,
            voters: Array.isArray(newCard.voters) ? newCard.voters : [],
            createdAt: newCard.createdAt,
          },
        ];
      });
    };

    const onCardUpdated = (payload: { cardId: string; text: string }) => {
      setCards((prev) =>
        prev.map((c) => (c.id === payload.cardId ? { ...c, text: payload.text } : c))
      );
    };

    const onCardDeleted = (payload: { cardId: string }) => {
      setCards((prev) => prev.filter((c) => c.id !== payload.cardId));
    };

    const onCardMoved = (payload: { cardId: string; targetTopicId: string }) => {
      setCards((prev) =>
        prev.map((c) => (c.id === payload.cardId ? { ...c, topicId: payload.targetTopicId } : c))
      );
    };

    const onCardsReordered = (payload: { topicId: string; cardIds: string[] }) => {
      if (!payload?.topicId || !Array.isArray(payload?.cardIds)) return;
      setCards((prev) => {
        const thisTopicCards = prev.filter((c) => c.topicId === payload.topicId);
        const cardMap = new Map(thisTopicCards.map((c) => [c.id, c]));
        const reorderedTopicCards = payload.cardIds
          .map((id) => cardMap.get(id))
          .filter(Boolean) as StickyCard[];

        thisTopicCards.forEach((c) => {
          if (!payload.cardIds.includes(c.id)) {
            reorderedTopicCards.push(c);
          }
        });

        let topicIdx = 0;
        return prev.map((c) => {
          if (c.topicId === payload.topicId) {
            return reorderedTopicCards[topicIdx++] || c;
          }
          return c;
        });
      });
    };

    const onCardVoted = (payload: { cardId: string; votes: number; voters?: string[] }) => {
      setCards((prev) => {
        const nextCards = prev.map((c) => {
          if (c.id === payload.cardId) {
            const updatedVoters = payload.voters || c.voters || [];
            const hasVoted = updatedVoters.some((v: string) => {
              const vLower = (v || '').toLowerCase().trim();
              return (
                (currentUser?.email && vLower === currentUser.email.toLowerCase().trim()) ||
                (currentUser?.email && vLower.includes(currentUser.email.toLowerCase().trim())) ||
                (currentAuthorName && vLower === currentAuthorName.toLowerCase().trim())
              );
            });

            return {
              ...c,
              votes: payload.votes,
              voters: updatedVoters,
              hasVoted,
            };
          }
          return c;
        });

        const activeVoteCount = nextCards.filter((c) => c.hasVoted).length;
        setRemainingVotes(Math.max(0, votingLimit - activeVoteCount));

        return nextCards;
      });
    };

    socket.on('card:created', onCardCreated);
    socket.on('card:updated', onCardUpdated);
    socket.on('card:deleted', onCardDeleted);
    socket.on('card:moved', onCardMoved);
    socket.on('cards:reordered', onCardsReordered);
    socket.on('card:voted', onCardVoted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('card:created', onCardCreated);
      socket.off('card:updated', onCardUpdated);
      socket.off('card:deleted', onCardDeleted);
      socket.off('card:moved', onCardMoved);
      socket.off('cards:reordered', onCardsReordered);
      socket.off('card:voted', onCardVoted);
    };
  }, [shareToken, currentAuthorName, currentUser?.email, votingLimit, setCards, setRemainingVotes]);

  return {
    socketConnected,
  };
}

export default useRetroSocketSync;
