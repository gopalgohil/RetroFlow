'use client';

import React, { useState } from 'react';
import {
  Calendar,
  ExternalLink,
  Share2,
  Edit3,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { RetroBoard } from '@/types/retro';
import { ShareInviteModal } from './ShareInviteModal';
import { SessionCardsSkeleton } from './DashboardSkeletons';

interface SessionListProps {
  sessions: RetroBoard[];
  onLaunch: (session: RetroBoard) => void;
  onEdit: (session: RetroBoard) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onCreateNew: () => void;
  isLoading: boolean;
  isAdmin?: boolean;
}

const ITEMS_PER_PAGE = 6;

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onLaunch,
  onEdit,
  onDelete,
  onCreateNew,
  isLoading,
  isAdmin = true,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitingSession, setInvitingSession] = useState<RetroBoard | null>(null);

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return s.status === 'active';
    if (activeFilter === 'completed') return s.status === 'completed';
    if (activeFilter === 'upcoming') {
      return new Date(s.scheduledDate) > new Date();
    }
    return true;
  });

  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const handleTabClick = (tabId: 'all' | 'active' | 'upcoming' | 'completed') => {
    if (tabId === activeFilter) return;
    setIsFilterLoading(true);
    setActiveFilter(tabId);
    setCurrentPage(1);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 380);
  };

  const handleCopyLink = (shareToken: string) => {
    const inviteUrl = `${window.location.origin}/retro/${shareToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await onDelete(deletingId);
    setDeletingId(null);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isCardsLoading = isLoading || isFilterLoading;

  return (
    <div className="space-y-6">
      {/* Session Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'active', label: 'Active Sessions' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All Sessions' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#5cb028] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {isCardsLoading ? (
          <div className="h-4 w-28 rounded bg-slate-200/80 animate-pulse" />
        ) : (
          <span className="text-xs font-semibold text-slate-500">
            {totalItems > ITEMS_PER_PAGE
              ? `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} Retros`
              : `Showing ${totalItems} of ${sessions.length} Retros`}
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {isCardsLoading && (
        <SessionCardsSkeleton count={filteredSessions.length > 0 ? Math.min(filteredSessions.length, 4) : 4} />
      )}

      {/* Empty State */}
      {!isCardsLoading && filteredSessions.length === 0 && (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#eaf5e3] text-[#3d8318] mx-auto flex items-center justify-center font-black text-lg">
            RF
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isAdmin ? `No ${activeFilter} sessions found` : 'No retrospective sessions available'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {isAdmin
                ? 'Create your first custom agile retrospective session with customized topics, voting limits, and live sync.'
                : 'You will see live sprint retrospectives here as soon as your Scrum Master or Admin invites you.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={onCreateNew}
              className="px-5 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-md shadow-[#5cb028]/20 transition-all cursor-pointer"
            >
              + Create New Retrospective
            </button>
          )}
        </div>
      )}

      {/* Sessions Grid */}
      {!isCardsLoading && filteredSessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedSessions.map((session) => (
            <div
              key={session._id}
              className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 hover:border-[#5cb028]/40 dark:hover:border-[#5cb028]/60 hover:shadow-md dark:hover:shadow-black/40 transition-all flex flex-col justify-between"
            >
              {/* Card Top Row: Status badge & Scheduled Date */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      session.status === 'active'
                        ? 'bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#86efac] border border-[#cdeac0] dark:border-[#5cb028]/30'
                        : session.status === 'completed'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        session.status === 'active' ? 'bg-[#5cb028] animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {session.status}
                  </span>

                  {session.approvalRequired && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#86efac] border border-[#cdeac0] dark:border-[#5cb028]/30">
                      Waiting Room
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(session.scheduledDate || session.createdAt)}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#5cb028] transition-colors">
                  {session.title}
                </h3>
                {session.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {session.description}
                  </p>
                )}
              </div>

              {/* Agenda Topics / Questions (Image 1 Matching with Dynamic Card Counts) */}
              {(() => {
                const topicsList =
                  session.topics && session.topics.length > 0
                    ? session.topics
                    : [
                        { title: 'What could be improved?', color: '#F43F5E' },
                        { title: 'What went well?', color: '#5cb028' },
                        { title: 'Action Items', color: '#0EA5E9' },
                      ];

                const colorMap: Record<string, { bg: string; text: string; border: string; badgeBg: string; badgeText: string }> = {
                  '#5cb028': { bg: 'bg-[#eaf5e3]', text: 'text-[#3d8318]', border: 'border-[#cdeac0]', badgeBg: 'bg-[#cdeac0]', badgeText: 'text-[#3d8318]' },
                  '#10B981': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', badgeBg: 'bg-emerald-200/70', badgeText: 'text-emerald-900' },
                  '#F43F5E': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80', badgeBg: 'bg-rose-200/70', badgeText: 'text-rose-900' },
                  '#0EA5E9': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/80', badgeBg: 'bg-sky-200/70', badgeText: 'text-sky-900' },
                  '#F59E0B': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', badgeBg: 'bg-amber-200/70', badgeText: 'text-amber-900' },
                  '#4F46E5': { bg: 'bg-[#eaf5e3]', text: 'text-[#3d8318]', border: 'border-[#cdeac0]', badgeBg: 'bg-[#cdeac0]', badgeText: 'text-[#3d8318]' },
                  '#8B5CF6': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/80', badgeBg: 'bg-purple-200/70', badgeText: 'text-purple-900' },
                  '#EC4899': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200/80', badgeBg: 'bg-pink-200/70', badgeText: 'text-pink-900' },
                  '#06B6D4': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200/80', badgeBg: 'bg-teal-200/70', badgeText: 'text-teal-900' },
                };

                return (
                  <div className="space-y-1.5 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      AGENDA TOPICS:
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {topicsList.map((t: any, idx: number) => {
                        let theme = colorMap[t.color];
                        if (!theme) {
                          const titleLower = (t.title || '').toLowerCase();
                          if (
                            titleLower.includes('improve') ||
                            titleLower.includes('bad') ||
                            titleLower.includes('frown') ||
                            titleLower.includes('problem')
                          ) {
                            theme = colorMap['#F43F5E'];
                          } else if (
                            titleLower.includes('well') ||
                            titleLower.includes('good') ||
                            titleLower.includes('win') ||
                            titleLower.includes('smile')
                          ) {
                            theme = colorMap['#10B981'];
                          } else if (
                            titleLower.includes('action') ||
                            titleLower.includes('item') ||
                            titleLower.includes('task') ||
                            titleLower.includes('target')
                          ) {
                            theme = colorMap['#0EA5E9'];
                          } else {
                            const fallbackColors = [
                              colorMap['#F43F5E'],
                              colorMap['#10B981'],
                              colorMap['#0EA5E9'],
                              colorMap['#8B5CF6'],
                            ];
                            theme = fallbackColors[idx % fallbackColors.length];
                          }
                        }

                        // Calculate dynamic card count for this topic
                        const cardCount = Array.isArray(session.cards)
                          ? session.cards.filter(
                              (c) =>
                                (t.topicId && c.topicId === t.topicId) ||
                                (t.id && c.topicId === t.id) ||
                                (t.title && c.topicId?.toLowerCase() === t.title.toLowerCase())
                            ).length
                          : 0;

                        return (
                          <span
                            key={t.topicId || idx}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all inline-flex items-center gap-1.5 ${theme.bg} ${theme.text} ${theme.border}`}
                          >
                            <span>{t.title}</span>
                            <span
                              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                            >
                              {cardCount}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}


              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {/* Left: Launch / Join + Share */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLaunch(session)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{isAdmin ? 'Open Board' : 'Join Live Board'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setInvitingSession(session)}
                      title="Invite Teammates & Developers"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-[#eaf5e3] hover:bg-[#def0d4] dark:bg-[#5cb028]/20 dark:hover:bg-[#5cb028]/30 text-[#3d8318] dark:text-[#86efac] border-[#cdeac0] dark:border-[#5cb028]/30"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#86efac]" />
                      <span>Share / Invite</span>
                    </button>
                  )}
                </div>

                {/* Right: Quick Action Buttons (Admin Only) */}
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(session)}
                      title="Edit Topics & Rules"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingId(session._id)}
                      title="Delete Retrospective"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enterprise Pagination Controls Footer (Active when > 6 retros) */}
      {!isCardsLoading && totalPages > 1 && (
        <div className="p-4 sm:px-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Range Info */}
          <div className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{startIndex + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">{endIndex}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> Retros
          </div>

          {/* Right: Page Navigation Controls */}
          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  p === safeCurrentPage
                    ? 'bg-[#5cb028] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Share / Invite Teammates Modal */}
      <ShareInviteModal
        isOpen={Boolean(invitingSession)}
        onClose={() => setInvitingSession(null)}
        session={invitingSession}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Delete Retrospective Session?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure? All sticky notes, votes, and discussion takeaways in this sprint will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
