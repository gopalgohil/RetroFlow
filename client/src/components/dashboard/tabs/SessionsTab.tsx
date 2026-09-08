'use client';

import React from 'react';
import { RetroBoard } from '@/types/retro';
import { SessionList } from '../SessionList';

interface SessionsTabProps {
  sessions: RetroBoard[];
  isLoading: boolean;
  activeSessionsCount: number;
  onLaunch: (session: RetroBoard) => void;
  onEdit: (session: RetroBoard) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onCreateNew: () => void;
  isAdmin?: boolean;
}

/**
 * SessionsTab Component
 * Displays retrospective sessions overview banner, key metrics, and agile session cards.
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
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Overview Card */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/60 border border-indigo-100/90 shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-indigo-400/10 via-purple-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100/70 text-indigo-700 border border-indigo-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            {isAdmin ? 'TeamRetro Engine' : 'Collaborative Workspace'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {isAdmin ? 'Agile Retrospective ' : 'My Team '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {isAdmin ? 'Hub' : 'Retrospectives'}
            </span>
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
            {isAdmin
              ? 'Facilitate high-impact continuous improvement retrospectives. Customize topics, set voting rules, and align team deliverables in real-time.'
              : 'Collaborate live with your agile team, submit honest feedback on sprint questions, and vote on team action items in real-time.'}
          </p>
        </div>

        {/* Quick Visual Stats */}
        <div className="relative z-10 hidden md:flex flex-col gap-2.5 shrink-0 bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-indigo-100/90 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
              ✓
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {isAdmin ? 'Active Retros' : 'Invited Retros'}
              </p>
              <p className="text-[11px] text-slate-500">
                {activeSessionsCount} Live Session{activeSessionsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
              ⚡
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Sprint Sync</p>
              <p className="text-[11px] text-slate-500">Real-time Connected</p>
            </div>
          </div>
        </div>
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
      />
    </div>
  );
};

export default SessionsTab;
