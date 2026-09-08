'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Smile,
  Frown,
  Lightbulb,
  Puzzle,
  Rocket,
  Anchor,
  Target,
  Flag,
  ArrowLeft,
  Copy,
  Check,
  Plus,
  ThumbsUp,
  Eye,
  EyeOff,
  Users,
  ShieldCheck,
  Calendar,
  Share2,
} from 'lucide-react';
import { api, ENDPOINTS } from '@/lib/api';
import { RetroBoard, RetroTopic } from '@/types/retro';
import { ShareInviteModal } from '@/components/dashboard/ShareInviteModal';
import { RetroBoardSkeleton } from '@/components/dashboard';

interface StickyCard {
  id: string;
  topicId: string;
  text: string;
  author: string;
  votes: number;
  hasVoted?: boolean;
}

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

export default function LiveRetroBoardPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const resolvedParams = use(params);
  const shareToken = resolvedParams.shareToken;
  const router = useRouter();

  const [retro, setRetro] = useState<RetroBoard | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Cards State
  const [cards, setCards] = useState<StickyCard[]>([]);
  const [newCardTexts, setNewCardTexts] = useState<Record<string, string>>({});
  const [activeInputTopicId, setActiveInputTopicId] = useState<string | null>(null);

  // Voting & Reveal Controls
  const [remainingVotes, setRemainingVotes] = useState(5);
  const [isRevealed, setIsRevealed] = useState(true);

  // Participant Identity (logged in user OR guest developer name)
  const [participantName, setParticipantName] = useState<string>('');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // 1. Initial Load: User & Session Data
  useEffect(() => {
    const storedUser = localStorage.getItem('retroflow_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
        setParticipantName(u.name);
      } catch {
        // Fallback
      }
    } else {
      const guest = sessionStorage.getItem('retroflow_participant_name');
      if (guest) {
        setParticipantName(guest);
      } else {
        setIsNamePromptOpen(true);
      }
    }

    const fetchRetroSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`${ENDPOINTS.RETROS}/${shareToken}`);
        const sessionData: RetroBoard = res.data;
        setRetro(sessionData);
        setRemainingVotes(sessionData.votingLimit || 5);
        setIsRevealed(!sessionData.revealMode);

        // Initialize with empty cards for a clean retro board
        setCards([]);
      } catch (err: any) {
        setError(err.message || 'Unable to load retrospective session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRetroSession();
  }, [shareToken]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFacilitator = Boolean(
    currentUser &&
      ((currentUser as any)?.role === 'admin' ||
        currentUser?.email === 'gopalgohel249@gmail.com' ||
        (retro?.createdBy &&
          (typeof retro.createdBy === 'object'
            ? (retro.createdBy as any)._id === (currentUser as any).id ||
              (retro.createdBy as any).email === currentUser.email
            : (retro.createdBy as any) === (currentUser as any).id)))
  );

  const currentAuthorName = currentUser?.name || participantName || 'Developer';

  const handleAddCard = (topicId: string) => {
    const text = (newCardTexts[topicId] || '').trim();
    if (!text) return;

    const newCard: StickyCard = {
      id: `card-${Date.now()}`,
      topicId,
      text,
      author: currentAuthorName,
      votes: 1,
    };

    setCards((prev) => [...prev, newCard]);
    setNewCardTexts((prev) => ({ ...prev, [topicId]: '' }));
    setActiveInputTopicId(null);
  };

  const handleVote = (cardId: string) => {
    if (remainingVotes <= 0) return;

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return { ...c, votes: c.votes + 1, hasVoted: true };
        }
        return c;
      })
    );
    setRemainingVotes((prev) => Math.max(0, prev - 1));
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  if (isLoading) {
    return <RetroBoardSkeleton />;
  }

  if (error || !retro) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 max-w-md">
          <h2 className="text-sm font-bold">Retrospective Not Found</h2>
          <p className="text-xs mt-1 text-rose-600">{error || 'Session does not exist or has expired.'}</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-500 transition-colors"
        >
          ← Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Session Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Left: Back button + Title & Status */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                {retro.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Session
              </span>
            </div>
            {retro.description && (
              <p className="text-xs text-slate-500 mt-0.5 max-w-md truncate">{retro.description}</p>
            )}
          </div>
        </div>

        {/* Right: Facilitator Controls & Share Action */}
        <div className="flex items-center gap-3">
          {/* Votes Tracker Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{remainingVotes} Votes Remaining</span>
          </div>

          {/* Reveal Mode Toggle - Facilitator Only */}
          {isFacilitator && retro.revealMode && (
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isRevealed
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              }`}
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isRevealed ? 'Hide Cards' : 'Reveal All Cards'}</span>
            </button>
          )}

          {/* Current Participant/Facilitator Role Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate max-w-[110px]">{currentAuthorName}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                isFacilitator
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isFacilitator ? 'Facilitator' : 'Developer'}
            </span>
          </div>

          {/* Invite Teammates Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Invite Teammates</span>
          </button>
        </div>
      </header>

      {/* Retrospective Columns Board Canvas */}
      <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-x-auto w-full">
        <div className="flex gap-3 sm:gap-4 items-start w-full min-w-max md:min-w-0 pb-6">
          {retro.topics?.map((topic: RetroTopic, idx: number) => {
            const ColumnIcon = ICON_MAP[topic.icon] || Smile;
            const columnCards = cards.filter((c) => c.topicId === topic.topicId);
            const isInputOpen = activeInputTopicId === topic.topicId;

            return (
              <div
                key={topic.topicId || idx}
                className="flex-1 min-w-[220px] rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-xs flex flex-col overflow-hidden transition-all"
              >
                {/* Column Top Accent Header */}
                <div
                  style={{ backgroundColor: `${topic.color}15`, borderBottomColor: `${topic.color}30` }}
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
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/90 text-slate-600 border border-slate-200 shrink-0">
                      {columnCards.length}
                    </span>
                  </div>
                  {topic.description && (
                    <p className="text-[10px] text-slate-500 leading-tight pl-8 truncate">
                      {topic.description}
                    </p>
                  )}
                </div>

                {/* Sticky Cards List Area */}
                <div className="p-2 sm:p-2.5 space-y-2 min-h-[220px] max-h-[calc(100vh-230px)] overflow-y-auto">
                  {columnCards.map((card) => (
                    <div
                      key={card.id}
                      style={{
                        backgroundColor: `${topic.color}08`,
                        borderColor: `${topic.color}30`,
                        borderLeftColor: topic.color,
                      }}
                      className={`p-2.5 rounded-xl border border-l-[3.5px] shadow-2xs hover:shadow-xs transition-all space-y-1.5 ${
                        !isRevealed ? 'filter blur-xs select-none' : ''
                      }`}
                    >
                      {/* Top Row: Vote Pill + Delete */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleVote(card.id)}
                          disabled={remainingVotes <= 0}
                          title="Vote on this thought"
                          style={{
                            color: card.hasVoted ? '#ffffff' : topic.color,
                            backgroundColor: card.hasVoted ? topic.color : `${topic.color}15`,
                            borderColor: `${topic.color}30`,
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <span>⇧</span>
                          <span>+{card.votes}</span>
                        </button>

                        {(isFacilitator || card.author === currentAuthorName) && (
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            title="Delete note"
                            className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Card Content Text */}
                      <p className="text-xs text-slate-800 leading-snug break-words font-medium">
                        {card.text}
                      </p>

                      {/* Author Subtitle */}
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/40 flex items-center justify-between">
                        <span className="truncate">by {card.author}</span>
                      </div>
                    </div>
                  ))}

                  {columnCards.length === 0 && !isInputOpen && (
                    <div className="py-8 text-center text-slate-400 text-[11px] italic">
                      No cards added yet.
                    </div>
                  )}

                  {/* Inline Add Card Input */}
                  {isInputOpen && (
                    <div className="p-2.5 rounded-xl bg-white border-2 border-indigo-500 shadow-sm space-y-2 animate-in fade-in">
                      <textarea
                        autoFocus
                        rows={2}
                        value={newCardTexts[topic.topicId] || ''}
                        onChange={(e) =>
                          setNewCardTexts((prev) => ({ ...prev, [topic.topicId]: e.target.value }))
                        }
                        placeholder="Write a thought or feedback..."
                        className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
                      />
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveInputTopicId(null)}
                          className="px-2 py-0.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddCard(topic.topicId)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Add Card
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Column "+ Add Card" Button */}
                <div className="p-2 border-t border-slate-100 bg-white">
                  <button
                    onClick={() => setActiveInputTopicId(topic.topicId)}
                    className="w-full py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Card</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Reusable Share / Invite Teammates Modal */}
      <ShareInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        session={retro}
      />

      {/* Guest Developer Name Prompt Modal */}
      {isNamePromptOpen && !participantName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md font-black">
                RF
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Join Retrospective</h3>
                <p className="text-xs text-slate-500">Enter your name to contribute sticky notes</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!nameInput.trim()) return;
                const name = nameInput.trim();
                setParticipantName(name);
                sessionStorage.setItem('retroflow_participant_name', name);
                setIsNamePromptOpen(false);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                autoFocus
                required
                placeholder="e.g. Alex Rivera, Dev Vishal..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:bg-indigo-300"
              >
                Join Retrospective Board →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
