'use client';

import React from 'react';
import { RetroBoard } from '@/types/retro';
import { SessionList } from '../SessionList';
import { SessionsSkeleton } from '../skeletons/SessionsSkeleton';

interface SessionsTabProps {
  sessions: RetroBoard[];
  isLoading: boolean;
  activeSessionsCount: number;
  onLaunch: (session: RetroBoard) => void;
  onEdit: (session: RetroBoard) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onToggleStatus?: (session: RetroBoard) => Promise<void>;
  onCreateNew: () => void;
  isAdmin?: boolean;
  user?: { name?: string; email?: string; role?: string; projectRole?: string } | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  sessions,
  isLoading,
  activeSessionsCount,
  onLaunch,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreateNew,
  isAdmin = true,
  user,
  searchQuery,
  onSearchChange,
}) => {
  if (isLoading && sessions.length === 0 && !searchQuery) {
    return <SessionsSkeleton />;
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const activeSessions = sessions.filter((s) => s.status === 'active');
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const liveCardsCount = activeSessions.reduce((acc, s) => acc + (s.cards?.length || 0), 0);
  // Sessions whose end date falls within the next 7 days (or has already passed).
  const endingSoonCount = activeSessions.filter((s) => {
    if (!s.endDate) return false;
    const end = new Date(s.endDate);
    if (isNaN(end.getTime())) return false;
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);
    return end <= weekAhead;
  }).length;

  const stats = [
    { label: 'Live sessions', value: activeSessionsCount || activeSessions.length, accent: true },
    { label: 'Ending in 7 days', value: endingSoonCount, warn: endingSoonCount > 0 },
    { label: 'Cards in live retros', value: liveCardsCount },
    { label: 'Completed', value: completedCount },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Retrospective Sessions
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {firstName}.{' '}
            {isAdmin
              ? 'Track live retros, feedback and follow-ups across your projects.'
              : 'Join live retros, share feedback and vote on action items.'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="px-4 py-3 rounded-xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08]"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p
                className={`mt-0.5 text-2xl font-extrabold tabular-nums ${
                  stat.warn
                    ? 'text-amber-600 dark:text-amber-400'
                    : stat.accent
                    ? 'text-[#3d8318] dark:text-[#88c958]'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <SessionList
        sessions={sessions}
        onLaunch={onLaunch}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onCreateNew={onCreateNew}
        isLoading={isLoading}
        isAdmin={isAdmin}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
    </div>
  );
};

export default SessionsTab;
