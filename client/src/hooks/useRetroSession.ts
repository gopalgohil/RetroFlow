'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, ENDPOINTS } from '@/lib/api';
import { getRetroSocket } from '@/lib/socket';
import { RetroBoard, StickyCard } from '@/types/retro';

export interface UseRetroSessionReturn {
  retro: RetroBoard | null;
  cards: StickyCard[];
  isLoading: boolean;
  error: string | null;
  remainingVotes: number;
  isRevealed: boolean;
  isFacilitator: boolean;
  canExportToSprint: boolean;
  currentAuthorName: string;
  currentUser: { id?: string; name: string; email: string; role?: string; isGuest?: boolean } | null;
  socketConnected: boolean;
  isNamePromptOpen: boolean;
  verifiedGuestEmail: string | null;
  isMagicInvite: boolean;
  setGuestName: (name: string, email?: string) => Promise<void> | void;
  setIsRevealed: React.Dispatch<React.SetStateAction<boolean>>;
  addCard: (topicId: string, text: string) => Promise<void>;
  updateCard: (cardId: string, text: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, targetTopicId: string) => Promise<void>;
  voteCard: (cardId: string) => Promise<void>;
  canEditCard: (card: StickyCard) => boolean;
  canDeleteCard: (card: StickyCard) => boolean;
  canManageCard: (card: StickyCard) => boolean;
}

/**
 * Senior Staff Engineer Level Custom Hook: useRetroSession
 * Encapsulates retrospective session hydration, optimistic state updates,
 * real-time bidirectional Socket.io synchronization, role-based permission checks,
 * and resilient REST API fallbacks into a clean, reusable boundary.
 */
export function useRetroSession(shareToken: string): UseRetroSessionReturn {
  const [retro, setRetro] = useState<RetroBoard | null>(null);
  const [cards, setCards] = useState<StickyCard[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name: string;
    email: string;
    role?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingVotes, setRemainingVotes] = useState<number>(5);
  const [isRevealed, setIsRevealed] = useState<boolean>(true);

  const [participantName, setParticipantName] = useState<string>('');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState<boolean>(false);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [verifiedGuestEmail, setVerifiedGuestEmail] = useState<string | null>(null);
  const [isMagicInvite, setIsMagicInvite] = useState<boolean>(false);

  // 1. Initial Load: Participant Identity & Board Fetching
  useEffect(() => {
    // Check URL parameters for ?invite=<magicToken>
    let urlInviteToken: string | null = null;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      urlInviteToken = urlParams.get('invite');
    }

    const guestSessionKey = `retroflow_guest_${shareToken}`;
    const storedGuest = typeof window !== 'undefined' ? sessionStorage.getItem(guestSessionKey) : null;

    if (urlInviteToken) {
      setIsMagicInvite(true);
      // Verify the encrypted magic token with backend
      api
        .post(`${ENDPOINTS.RETROS}/${shareToken}/verify-magic-invite`, { token: urlInviteToken })
        .then((res: any) => {
          const verifiedEmail = res.data?.email;
          if (verifiedEmail) {
            setVerifiedGuestEmail(verifiedEmail);

            // Save active JWT session if returned
            if (res.data?.token) {
              localStorage.setItem('retroflow_token', res.data.token);
            }

            // If developer already entered their display name in this session, restore it
            if (storedGuest) {
              try {
                const parsed = JSON.parse(storedGuest);
                if (parsed.email === verifiedEmail && parsed.name) {
                  setCurrentUser(parsed);
                  setParticipantName(parsed.name);
                  localStorage.setItem('retroflow_user', JSON.stringify(parsed));
                  setIsNamePromptOpen(false);
                  return;
                }
              } catch {
                // proceed to prompt
              }
            }

            // Check if logged-in user matches the invited email
            const storedUser = localStorage.getItem('retroflow_user');
            if (storedUser) {
              try {
                const u = JSON.parse(storedUser);
                if (u.email?.toLowerCase() === verifiedEmail.toLowerCase()) {
                  setCurrentUser({ ...u, isGuest: false });
                  setParticipantName(u.name);
                  setIsNamePromptOpen(false);
                  return;
                }
              } catch {}
            }

            // Prompt for display name with verified email attached
            setIsNamePromptOpen(true);
          }
        })
        .catch((err: any) => {
          console.warn('[RetroSession] Magic invite verification failed:', err.message);
          setIsNamePromptOpen(true);
        });
    } else {
      // Standard flow: Check authenticated user or existing guest session
      const storedUser = localStorage.getItem('retroflow_user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          setCurrentUser(u);
          setParticipantName(u.name);
        } catch {
          // Fallback
        }
      } else if (storedGuest) {
        try {
          const parsed = JSON.parse(storedGuest);
          setCurrentUser(parsed);
          setParticipantName(parsed.name);
          if (parsed.email) {
            setVerifiedGuestEmail(parsed.email);
            setIsMagicInvite(true);
          }
        } catch {
          setIsNamePromptOpen(true);
        }
      } else {
        const guest = sessionStorage.getItem('retroflow_participant_name');
        if (guest) {
          setParticipantName(guest);
        } else {
          setIsNamePromptOpen(true);
        }
      }
    }

    const fetchSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`${ENDPOINTS.RETROS}/${shareToken}`);
        const sessionData: RetroBoard = res.data;
        setRetro(sessionData);
        setRemainingVotes(sessionData.votingLimit || 5);
        setIsRevealed(!sessionData.revealMode);

        if (sessionData.cards && Array.isArray(sessionData.cards)) {
          setCards(
            sessionData.cards.map((c: any) => ({
              id: c.cardId || c.id,
              cardId: c.cardId || c.id,
              topicId: c.topicId,
              text: c.text,
              author: c.author,
              authorEmail: c.authorEmail,
              votes: typeof c.votes === 'number' ? c.votes : 0,
              voters: Array.isArray(c.voters) ? c.voters : [],
              hasVoted: Array.isArray(c.voters) && (
                c.voters.some((v: string) => {
                    const vLower = v.toLowerCase().trim();
                    return (
                        (currentAuthorName && vLower === currentAuthorName.toLowerCase().trim()) ||
                        (currentUser?.email && vLower === currentUser.email.toLowerCase().trim())
                    );
                })
              ),
              createdAt: c.createdAt,
            }))
          );
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load retrospective session');
      } finally {
        setIsLoading(false);
      }
    };

    if (shareToken) {
      fetchSession();
    }
  }, [shareToken]);

  const currentAuthorName = useMemo(
    () => currentUser?.name || participantName || 'Developer',
    [currentUser?.name, participantName]
  );

  // Derive Facilitator & Sprint Export Access (Admin, Manager, Project Lead)
  const canExportToSprint = useMemo(() => {
    if (!currentUser) return false;
    const role = currentUser.role?.toLowerCase() || '';
    const email = currentUser.email?.toLowerCase().trim() || '';

    // 1. Workspace Admin
    if (
      role === 'admin' ||
      email === 'gopalgohel249@gmail.com' ||
      email.includes('admin')
    ) {
      return true;
    }

    // 2. Manager or Project/Team Lead
    const projectRole = (currentUser as any)?.projectRole;
    if (
      projectRole === 'Manager' ||
      projectRole === 'Project Lead' ||
      role === 'manager' ||
      role === 'project lead' ||
      role === 'team lead' ||
      role.includes('lead') ||
      role.includes('manager')
    ) {
      return true;
    }

    // 3. Creator of the retro board
    if (retro?.createdBy) {
      if (typeof retro.createdBy === 'object') {
        if (
          (retro.createdBy as any)._id === currentUser.id ||
          (retro.createdBy as any).email === currentUser.email
        ) {
          return true;
        }
      } else if ((retro.createdBy as any) === currentUser.id) {
        return true;
      }
    }

    // 4. Project Lead or Project Manager on linked project
    if (retro?.project) {
      const projLeadEmail = retro.project.lead?.email?.toLowerCase().trim();
      if (projLeadEmail && projLeadEmail === email) {
        return true;
      }
      const member = retro.project.members?.find(
        (m: any) => m.email?.toLowerCase().trim() === email
      );
      if (member) {
        const mRole = member.role?.toLowerCase() || '';
        if (mRole === 'manager' || mRole.includes('lead') || mRole.includes('manager')) {
          return true;
        }
      }
    }

    return false;
  }, [currentUser, retro?.createdBy, retro?.project]);

  const isFacilitator = canExportToSprint;

  // 2. Socket.io Real-Time Synchronization
  useEffect(() => {
    if (!shareToken) return;

    const socket = getRetroSocket();

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit(
        'join:retro',
        {
          shareToken,
          user: {
            name: currentAuthorName,
            email: currentUser?.email || '',
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
                  c.voters.some(
                    (v: string) => {
                      const vLower = v.toLowerCase().trim();
                      return (
                        (currentAuthorName && vLower === currentAuthorName.toLowerCase().trim()) ||
                        (currentUser?.email && vLower === currentUser.email.toLowerCase().trim())
                      );
                    }
                  ),
                createdAt: c.createdAt,
              }))
            );
            const votedCount = response.cards.filter(
              (c: any) =>
                Array.isArray(c.voters) &&
                c.voters.some(
                  (v: string) => {
                    const vLower = v.toLowerCase().trim();
                    return (
                      (currentAuthorName && vLower === currentAuthorName.toLowerCase().trim()) ||
                      (currentUser?.email && vLower === currentUser.email.toLowerCase().trim())
                    );
                  }
                )
            ).length;
            setRemainingVotes(Math.max(0, (retro?.votingLimit || 5) - votedCount));
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

    const onCardVoted = (payload: { cardId: string; votes: number; voters?: string[] }) => {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === payload.cardId) {
            const updatedVoters = payload.voters || c.voters || [];
            const hasVoted = updatedVoters.some(
              (v: string) => {
                const vLower = v.toLowerCase().trim();
                return (
                  (currentAuthorName && vLower === currentAuthorName.toLowerCase().trim()) ||
                  (currentUser?.email && vLower === currentUser.email.toLowerCase().trim())
                );
              }
            );

            return {
              ...c,
              votes: payload.votes,
              voters: updatedVoters,
              hasVoted,
            };
          }
          return c;
        })
      );
    };

    socket.on('card:created', onCardCreated);
    socket.on('card:updated', onCardUpdated);
    socket.on('card:deleted', onCardDeleted);
    socket.on('card:moved', onCardMoved);
    socket.on('card:voted', onCardVoted);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('card:created', onCardCreated);
      socket.off('card:updated', onCardUpdated);
      socket.off('card:deleted', onCardDeleted);
      socket.off('card:moved', onCardMoved);
      socket.off('card:voted', onCardVoted);
    };
  }, [shareToken, currentAuthorName, currentUser?.email]);

  // 3. Permission Checks
  // Feedback Integrity Check: ONLY the original author can edit their own card
  const isAuthorOfCard = useCallback(
    (card: StickyCard) => {
      if (
        currentUser?.email &&
        card.authorEmail &&
        currentUser.email.trim().toLowerCase() === card.authorEmail.trim().toLowerCase()
      ) {
        return true;
      }
      if (
        card.author &&
        currentAuthorName &&
        card.author.trim().toLowerCase() === currentAuthorName.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    },
    [currentUser?.email, currentAuthorName]
  );

  // Edit Permission: Strict Author-Only (Admin CANNOT alter or tamper with a developer's feedback)
  const canEditCard = useCallback(
    (card: StickyCard) => {
      return isAuthorOfCard(card);
    },
    [isAuthorOfCard]
  );

  // Delete Permission: Author can delete their own; Admin/Facilitator can delete for spam/abuse moderation
  const canDeleteCard = useCallback(
    (card: StickyCard) => {
      if (isFacilitator) return true;
      return isAuthorOfCard(card);
    },
    [isFacilitator, isAuthorOfCard]
  );

  const canManageCard = canDeleteCard;

  // 4. Solution 1: Instant Participant Identity & Session Activation
  const setGuestName = useCallback(
    async (name: string, email?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setParticipantName(trimmed);

      const effectiveEmail = (email || verifiedGuestEmail || '').toLowerCase().trim();

      try {
        // Solution 1: Activate genuine session & map to project role in MongoDB
        const res = await api.post(`${ENDPOINTS.RETROS}/${shareToken}/join-participant`, {
          name: trimmed,
          email: effectiveEmail,
        });

        if (res.data?.user && res.data?.token) {
          const userPayload = res.data.user;
          setCurrentUser(userPayload);
          localStorage.setItem('retroflow_token', res.data.token);
          localStorage.setItem('retroflow_user', JSON.stringify(userPayload));
          sessionStorage.setItem(`retroflow_guest_${shareToken}`, JSON.stringify(userPayload));
          sessionStorage.setItem('retroflow_participant_name', trimmed);

          // If linked project returned, cache it for instant 0ms switching
          if (res.data.project) {
            sessionStorage.setItem(
              `retroflow_cached_project_${res.data.project.id}`,
              JSON.stringify(res.data.project)
            );
          }

          setIsNamePromptOpen(false);
          return;
        }
      } catch (err) {
        console.warn('[RetroSession] Backend join-participant failed, using resilient client fallback:', err);
      }

      // Resilient fallback
      const guestProfile = {
        name: trimmed,
        email: effectiveEmail,
        role: 'Developer',
        isGuest: true,
      };

      setCurrentUser(guestProfile);
      localStorage.setItem('retroflow_user', JSON.stringify(guestProfile));
      localStorage.setItem('retroflow_token', `guest-token-${Date.now()}`);
      sessionStorage.setItem(`retroflow_guest_${shareToken}`, JSON.stringify(guestProfile));
      sessionStorage.setItem('retroflow_participant_name', trimmed);
      setIsNamePromptOpen(false);
    },
    [verifiedGuestEmail, shareToken]
  );

  // 5. Card CRUD Operations (Optimistic + Real-Time + REST Fallback)
  const addCard = useCallback(
    async (topicId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !shareToken) return;

      const payload = {
        shareToken,
        topicId,
        text: trimmed,
        author: currentAuthorName,
        authorEmail: currentUser?.email || '',
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
    [shareToken, currentAuthorName, currentUser?.email]
  );

  const updateCard = useCallback(
    async (cardId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !shareToken) return;

      // Optimistic Update
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, text: trimmed } : c))
      );

      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit('card:edit', {
          shareToken,
          cardId,
          text: trimmed,
          user: {
            name: currentAuthorName,
            email: currentUser?.email || '',
          },
        });
      } else {
        try {
          await api.put(`${ENDPOINTS.RETROS}/${shareToken}/cards/${cardId}`, {
            text: trimmed,
            user: {
              name: currentAuthorName,
              email: currentUser?.email || '',
            },
          });
        } catch (err) {
          console.error('[RetroSession] Failed to update card:', err);
        }
      }
    },
    [shareToken, currentAuthorName, currentUser?.email]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!shareToken) return;

      // Optimistic Removal
      setCards((prev) => prev.filter((c) => c.id !== cardId));

      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit('card:delete', {
          shareToken,
          cardId,
        });
      } else {
        try {
          await api.delete(`${ENDPOINTS.RETROS}/${shareToken}/cards/${cardId}`);
        } catch (err) {
          console.error('[RetroSession] Failed to delete card:', err);
        }
      }
    },
    [shareToken]
  );

  const moveCard = useCallback(
    async (cardId: string, targetTopicId: string) => {
      if (!shareToken || !cardId || !targetTopicId) return;

      // Optimistic move in local state
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, topicId: targetTopicId } : c))
      );

      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit('card:move', {
          shareToken,
          cardId,
          targetTopicId,
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
    [shareToken]
  );

  const voteCard = useCallback(
    async (cardId: string) => {
      if (!shareToken) return;

      const targetCard = cards.find((c) => c.id === cardId);
      if (!targetCard) return;

      const voterIdentifier = currentAuthorName;
      const isCurrentlyVoted =
        Boolean(targetCard.hasVoted) ||
        (Array.isArray(targetCard.voters) &&
          targetCard.voters.some(
            (v) =>
              v.toLowerCase() === voterIdentifier.toLowerCase() ||
              (currentUser?.email && v.toLowerCase() === currentUser.email.toLowerCase())
          ));

      // If user has not voted yet and has no votes remaining, do nothing
      if (!isCurrentlyVoted && remainingVotes <= 0) {
        return;
      }

      const willBeVoted = !isCurrentlyVoted;

      // Optimistic Like / Unlike Toggle
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === cardId) {
            let updatedVoters = Array.isArray(c.voters) ? [...c.voters] : [];
            if (willBeVoted) {
              if (!updatedVoters.some((v) => v.toLowerCase() === voterIdentifier.toLowerCase())) {
                updatedVoters.push(voterIdentifier);
              }
            } else {
              updatedVoters = updatedVoters.filter(
                (v) =>
                  v.toLowerCase() !== voterIdentifier.toLowerCase() &&
                  (!currentUser?.email || v.toLowerCase() !== currentUser.email.toLowerCase())
              );
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

      // Dynamically adjust remaining votes quota
      setRemainingVotes((prev) => (willBeVoted ? Math.max(0, prev - 1) : prev + 1));

      const socket = getRetroSocket();
      if (socket && socket.connected) {
        socket.emit('card:vote', {
          shareToken,
          cardId,
          voter: voterIdentifier,
        });
      } else {
        try {
          await api.post(`${ENDPOINTS.RETROS}/${shareToken}/cards/${cardId}/vote`, {
            voter: voterIdentifier,
          });
        } catch (err) {
          console.error('[RetroSession] Failed to toggle vote on card:', err);
        }
      }
    },
    [cards, remainingVotes, shareToken, currentUser?.email, currentAuthorName]
  );


  return {
    retro,
    cards,
    isLoading,
    error,
    remainingVotes,
    isRevealed,
    isFacilitator,
    canExportToSprint,
    currentAuthorName,
    currentUser,
    socketConnected,
    isNamePromptOpen,
    verifiedGuestEmail,
    isMagicInvite,
    setGuestName,
    setIsRevealed,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    voteCard,
    canEditCard,
    canDeleteCard,
    canManageCard,
  };
}

export default useRetroSession;
