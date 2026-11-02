'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api, ENDPOINTS } from '@/lib/api';
import { updateRetroSocketAuth, getRetroSocket } from '@/lib/socket';
import { RetroBoard, StickyCard } from '@/types/retro';
import { useRetroPermissions } from './retro/useRetroPermissions';
import { useRetroSocketSync } from './retro/useRetroSocketSync';
import { useRetroCards } from './retro/useRetroCards';

export interface UseRetroSessionReturn {
  retro: RetroBoard | null;
  cards: StickyCard[];
  isLoading: boolean;
  error: string | null;
  remainingVotes: number;
  isRevealed: boolean;
  isFacilitator: boolean;
  canExportToSprint: boolean;
  canMoveCrossColumn: boolean;
  currentAuthorName: string;
  currentUser: { id?: string; name: string; email: string; role?: string; projectRole?: string; isGuest?: boolean } | null;
  effectiveUserRole: string;
  socketConnected: boolean;
  isNamePromptOpen: boolean;
  verifiedGuestEmail: string | null;
  isMagicInvite: boolean;
  isGuest: boolean;
  setGuestName: (name: string, email?: string) => Promise<void> | void;
  setIsRevealed: React.Dispatch<React.SetStateAction<boolean>>;
  setRetro: React.Dispatch<React.SetStateAction<RetroBoard | null>>;
  setCards: React.Dispatch<React.SetStateAction<StickyCard[]>>;
  endSession: () => Promise<void>;
  reopenSession: () => Promise<void>;
  addCard: (topicId: string, text: string) => Promise<void>;
  updateCard: (cardId: string, text: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCard: (cardId: string, targetTopicId: string) => Promise<void>;
  reorderCards: (topicId: string, cardIds: string[]) => Promise<void>;
  voteCard: (cardId: string) => Promise<void>;
  canEditCard: (card: StickyCard) => boolean;
  canDeleteCard: (card: StickyCard) => boolean;
  canManageCard: (card: StickyCard) => boolean;
}

export function useRetroSession(shareToken: string): UseRetroSessionReturn {
  const [retro, setRetro] = useState<RetroBoard | null>(null);
  const [cards, setCards] = useState<StickyCard[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name: string;
    email: string;
    role?: string;
    projectRole?: string;
    isGuest?: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingVotes, setRemainingVotes] = useState<number>(1);
  const [isRevealed, setIsRevealed] = useState<boolean>(true);

  const [participantName, setParticipantName] = useState<string>('');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState<boolean>(false);
  const [verifiedGuestEmail, setVerifiedGuestEmail] = useState<string | null>(null);
  const [isMagicInvite, setIsMagicInvite] = useState<boolean>(false);

  const cardsRef = useRef<StickyCard[]>([]);
  cardsRef.current = cards;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const retroRef = useRef<RetroBoard | null>(null);
  retroRef.current = retro;
  const authFetchedRef = useRef(false);

  useEffect(() => {
    let urlInviteToken: string | null = null;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      urlInviteToken = urlParams.get('invite');
    }

    const guestSessionKey = `retroflow_guest_${shareToken}`;
    const storedGuest = typeof window !== 'undefined' ? sessionStorage.getItem(guestSessionKey) : null;

    if (urlInviteToken) {
      setIsMagicInvite(true);
      api
        .post(`${ENDPOINTS.RETROS}/${shareToken}/verify-magic-invite`, { token: urlInviteToken })
        .then((res: any) => {
          const verifiedEmail = res.data?.email;
          if (verifiedEmail) {
            setVerifiedGuestEmail(verifiedEmail);

            if (res.data?.token) {
              localStorage.setItem('retroflow_token', res.data.token);
            }

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
              } catch { }
            }

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
              } catch { }
            }

            setIsNamePromptOpen(true);
          }
        })
        .catch((err: any) => {
          console.warn('[RetroSession] Magic invite verification failed:', err.message);
          setIsNamePromptOpen(true);
        });
    } else {
      const storedUser = localStorage.getItem('retroflow_user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          setCurrentUser(u);
          setParticipantName(u.name);
        } catch { }
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

      const token = typeof window !== 'undefined' ? localStorage.getItem('retroflow_token') : null;
      if (token && !authFetchedRef.current) {
        authFetchedRef.current = true;
        api
          .get(ENDPOINTS.AUTH.ME)
          .then((res: any) => {
            const profile = res.data?.user || res.data;
            if (profile && profile.email) {
              setCurrentUser((prev) => ({
                ...prev,
                ...profile,
                id: profile._id || profile.id || prev?.id,
                name: profile.name || prev?.name || '',
                email: profile.email || prev?.email || '',
                role: profile.role || prev?.role,
                projectRole: profile.projectRole || prev?.projectRole,
              }));
              localStorage.setItem('retroflow_user', JSON.stringify(profile));
            }
          })
          .catch(() => { });
      }
    }

    const fetchSession = async () => {
      if (!retroRef.current) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const res = await api.get(`${ENDPOINTS.RETROS}/${shareToken}`);
        const sessionData: RetroBoard = res.data;
        setRetro(sessionData);
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
              assignedTo:
                c.assignedTo && typeof c.assignedTo === 'object' && c.assignedTo.name
                  ? c.assignedTo
                  : typeof c.assignedTo === 'string' && c.assignedTo.trim() && c.assignedTo !== 'Unassigned'
                  ? { name: c.assignedTo.trim() }
                  : null,
              assignedSprintName: c.assignedSprintName || null,
              isExportedToActionItems: Boolean(
                c.isExportedToActionItems ||
                c.assignedSprintName ||
                (c.assignedTo && typeof c.assignedTo === 'object' && c.assignedTo.name)
              ),
              hasVoted: Array.isArray(c.voters) && (
                c.voters.some((v: string) => {
                  const vLower = (v || '').toLowerCase().trim();
                  return (
                    (currentUserRef.current?.email && vLower === currentUserRef.current.email.toLowerCase().trim()) ||
                    (currentUserRef.current?.email && vLower.includes(currentUserRef.current.email.toLowerCase().trim())) ||
                    (participantName && vLower === participantName.toLowerCase().trim())
                  );
                })
              ),
              createdAt: c.createdAt,
            }))
          );

          const votedCount = sessionData.cards.filter(
            (c: any) =>
              Array.isArray(c.voters) &&
              c.voters.some((v: string) => {
                const vLower = (v || '').toLowerCase().trim();
                return (
                  (currentUserRef.current?.email && vLower === currentUserRef.current.email.toLowerCase().trim()) ||
                  (currentUserRef.current?.email && vLower.includes(currentUserRef.current.email.toLowerCase().trim())) ||
                  (participantName && vLower === participantName.toLowerCase().trim())
                );
              })
          ).length;
          const limit = sessionData.votingLimit || 1;
          setRemainingVotes(Math.max(0, limit - votedCount));
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
  }, [shareToken, participantName]);

  useEffect(() => {
    if (!retro) return;
    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    if (!userEmail) return;

    const isCreator =
      (retro.createdBy?._id && String(retro.createdBy._id) === String(currentUser?.id)) ||
      retro.createdBy?.email?.toLowerCase().trim() === userEmail;
    const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
    const isProjectLead =
      retro.project?.lead?.email?.toLowerCase().trim() === userEmail;
    const isWhitelisted =
      Array.isArray(retro.approvedMembers) &&
      retro.approvedMembers.some(
        (em) => em && em.toLowerCase().trim() === userEmail
      );

    if (!isCreator && !isAdmin && !isProjectLead && !isWhitelisted) {
      setError(
        `Access Denied: "${userEmail}" is not invited to this retrospective session. Only users invited by the Admin or Manager can join.`
      );
    }
  }, [retro, currentUser?.email, currentUser?.id, currentUser?.role]);

  const currentAuthorName = useMemo(
    () => currentUser?.name || participantName || 'Developer',
    [currentUser?.name, participantName]
  );

  const {
    canExportToSprint,
    isFacilitator,
    isGuest,
    effectiveUserRole,
    canMoveCrossColumn,
    canEditCard,
    canDeleteCard,
    canManageCard,
  } = useRetroPermissions({
    currentUser,
    currentAuthorName,
    verifiedGuestEmail,
    retro,
  });

  const { socketConnected } = useRetroSocketSync({
    shareToken,
    currentUser,
    currentAuthorName,
    effectiveUserRole,
    votingLimit: retro?.votingLimit || 1,
    setCards,
    setRemainingVotes,
    setRetro,
  });

  const setGuestName = useCallback(
    async (name: string, email?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setParticipantName(trimmed);

      const effectiveEmail = (email || verifiedGuestEmail || '').toLowerCase().trim();

      try {
        const res = await api.post(`${ENDPOINTS.RETROS}/${shareToken}/join-participant`, {
          name: trimmed,
          email: effectiveEmail,
        });

        if (res.data?.user && res.data?.token) {
          const userPayload = res.data.user;
          setCurrentUser(userPayload);
          localStorage.setItem('retroflow_token', res.data.token);
          updateRetroSocketAuth(res.data.token);
          localStorage.setItem('retroflow_user', JSON.stringify(userPayload));
          sessionStorage.setItem(`retroflow_guest_${shareToken}`, JSON.stringify(userPayload));
          sessionStorage.setItem('retroflow_participant_name', trimmed);

          if (res.data.project) {
            sessionStorage.setItem(
              `retroflow_cached_project_${res.data.project.id}`,
              JSON.stringify(res.data.project)
            );
          }

          setIsNamePromptOpen(false);
          return;
        }
      } catch (err: any) {
        console.warn('[RetroSession] Backend join-participant failed:', err);
        const errMsg = err?.message || 'Access Denied: You are not on the invited list for this retrospective.';
        throw new Error(errMsg);
      }
    },
    [verifiedGuestEmail, shareToken]
  );

  const {
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCards,
    voteCard,
  } = useRetroCards({
    shareToken,
    currentAuthorName,
    participantName,
    canMoveCrossColumn,
    cardsRef,
    currentUserRef,
    setCards,
    setRemainingVotes,
  });

  const endSession = useCallback(async () => {
    if (!retro) return;
    try {
      const retroIdentifier = retro._id || shareToken;
      await api.put(`${ENDPOINTS.RETROS}/${retroIdentifier}`, {
        status: 'completed',
      });
      setRetro((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      const socket = getRetroSocket();
      if (socket.connected) {
        socket.emit('session:end', { shareToken, retroId: retro._id });
      }
    } catch (err: any) {
      console.error('[RetroSession] Failed to end session:', err);
      throw err;
    }
  }, [retro, shareToken]);

  const reopenSession = useCallback(async () => {
    if (!retro) return;
    try {
      const retroIdentifier = retro._id || shareToken;
      await api.put(`${ENDPOINTS.RETROS}/${retroIdentifier}`, {
        status: 'active',
      });
      setRetro((prev) => (prev ? { ...prev, status: 'active' } : prev));
      const socket = getRetroSocket();
      if (socket.connected) {
        socket.emit('session:reopen', { shareToken, retroId: retro._id });
      }
    } catch (err: any) {
      console.error('[RetroSession] Failed to reopen session:', err);
      throw err;
    }
  }, [retro, shareToken]);

  return {
    retro,
    cards,
    isLoading,
    error,
    remainingVotes,
    isRevealed,
    isFacilitator,
    canExportToSprint,
    canMoveCrossColumn,
    currentAuthorName,
    currentUser,
    effectiveUserRole,
    socketConnected,
    isNamePromptOpen,
    verifiedGuestEmail,
    isMagicInvite,
    isGuest,
    setGuestName,
    setIsRevealed,
    setRetro,
    setCards,
    endSession,
    reopenSession,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCards,
    voteCard,
    canEditCard,
    canDeleteCard,
    canManageCard,
  };
}

export default useRetroSession;
