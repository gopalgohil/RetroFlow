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
  Smile,
  Frown,
  Lightbulb,
  Puzzle,
  Rocket,
  Anchor,
  Target,
  Flag,
} from 'lucide-react';
import { RetroBoard } from '@/types/retro';
import { ShareInviteModal } from './ShareInviteModal';

interface SessionListProps {
  sessions: RetroBoard[];
  onLaunch: (session: RetroBoard) => void;
  onEdit: (session: RetroBoard) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onCreateNew: () => void;
  isLoading: boolean;
  isAdmin?: boolean;
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

  return (
    <div className="space-y-6">
      {/* Session Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
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
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredSessions.length} of {sessions.length} Retros
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs animate-pulse space-y-4"
            >
              <div className="h-4 bg-slate-200 rounded-md w-2/3" />
              <div className="h-3 bg-slate-100 rounded-md w-1/3" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSessions.length === 0 && (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-black text-lg">
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              + Create New Retrospective
            </button>
          )}
        </div>
      )}

      {/* Sessions Grid */}
      {!isLoading && filteredSessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSessions.map((session) => (
            <div
              key={session._id}
              className="group relative p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Card Top Row: Status badge & Scheduled Date */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      session.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : session.status === 'completed'
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        session.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {session.status}
                  </span>

                  {session.approvalRequired && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Waiting Room
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(session.scheduledDate || session.createdAt)}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mb-4">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {session.title}
                </h3>
                {session.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {session.description}
                  </p>
                )}
              </div>

              {/* Color-Coded Topics Summary */}
              <div className="space-y-2 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Configured Topics ({session.topics?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {session.topics?.map((topic) => {
                    const TopicIcon = ICON_MAP[topic.icon] || Smile;
                    return (
                      <span
                        key={topic.topicId}
                        style={{
                          backgroundColor: `${topic.color}12`,
                          color: topic.color,
                          borderColor: `${topic.color}30`,
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold"
                      >
                        <TopicIcon className="w-3 h-3" />
                        <span>{topic.title}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Left: Launch / Join + Share */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLaunch(session)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{isAdmin ? 'Open Board' : 'Join Live Board'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setInvitingSession(session)}
                      title="Invite Teammates & Developers"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-700 border-indigo-200/80 hover:border-indigo-300"
                    >
                      <Share2 className="w-3.5 h-3.5 text-indigo-600" />
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingId(session._id)}
                      title="Delete Retrospective"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
