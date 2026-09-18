'use client';

import React from 'react';
import { RetroBoard } from '@/types/retro';
import { SessionList } from '../SessionList';
import { Layers, Activity, CheckSquare, Award, Sparkles, Plus } from 'lucide-react';

interface SessionsTabProps {
  sessions: RetroBoard[];
  isLoading: boolean;
  activeSessionsCount: number;
  onLaunch: (session: RetroBoard) => void;
  onEdit: (session: RetroBoard) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onCreateNew: () => void;
  isAdmin?: boolean;
  user?: { name?: string; email?: string; role?: string; projectRole?: string } | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

/**
 * SessionsTab Component
 * Renders the Digiflux leaf-green welcome banner, 4 metric KPI overview cards,
 * and the sprint retrospective boards list.
 */
export const SessionsTab: React.FC<SessionsTabProps> = ({
  sessions,
  isLoading,
  activeSessionsCount,
  onLaunch,
  onEdit,
  onDelete,
  onCreateNew,
  isAdmin = true,
  user,
  searchQuery,
  onSearchChange,
}) => {
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const totalTopicsCount = sessions.reduce((acc, s) => acc + (s.topics?.length || 3), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Digiflux Signature Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#5cb028] via-[#54a324] to-[#458b1b] text-white shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 dark:from-[#0e1015] dark:via-[#0e1015] dark:to-[#0e1015] dark:border dark:border-white/[0.08] dark:shadow-2xl group">
        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 dark:bg-[#88c958]/10 rounded-full blur-2xl dark:blur-3xl pointer-events-none" />
        <div className="absolute top-2 right-1/4 w-32 h-32 bg-emerald-300/10 dark:bg-[#88c958]/5 rounded-full blur-xl dark:blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs border border-white/25 shadow-2xs dark:bg-[#88c958]/10 dark:text-[#88c958] dark:border-[#88c958]/25">
            <Sparkles className="w-3.5 h-3.5 text-white dark:hidden" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#88c958] animate-pulse hidden dark:inline-block" />
            <span>{isAdmin ? 'Agile Retrospective Engine' : 'Collaborative Workspace'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white dark:font-black">
            Welcome back, <span className="text-white dark:text-[#88c958]">{firstName}</span>!
          </h2>

          <p className="text-white/90 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            {isAdmin
              ? "Here's an overview of your team sprint retrospectives, feedback topics, and continuous improvement action items."
              : 'Collaborate live with your agile team, submit honest feedback on sprint questions, and vote on team action items in real-time.'}
          </p>
        </div>

        {/* Quick Action Button in Banner */}
        {isAdmin && (
          <div className="relative z-10 shrink-0">
            <button
              onClick={onCreateNew}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#3d8318] text-xs font-extrabold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a] dark:font-black dark:shadow-[0_0_16px_rgba(136,201,88,0.25)] dark:hover:shadow-[0_0_24px_rgba(136,201,88,0.4)]"
            >
              <Plus className="w-4 h-4 text-[#5cb028] dark:text-[#08090a]" />
              <span>Create Retrospective</span>
            </button>
          </div>
        )}
      </div>

      {/* Sessions Grid List */}
      <SessionList
        sessions={sessions}
        onLaunch={onLaunch}
        onEdit={onEdit}
        onDelete={onDelete}
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
