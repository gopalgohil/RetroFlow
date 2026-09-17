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
}) => {
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const totalTopicsCount = sessions.reduce((acc, s) => acc + (s.topics?.length || 3), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Digiflux Signature Green Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#5cb028] via-[#54a324] to-[#458b1b] text-white shadow-sm overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-2 right-1/4 w-32 h-32 bg-emerald-300/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs border border-white/25 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>{isAdmin ? 'Agile Retrospective Engine' : 'Collaborative Workspace'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {firstName}!
          </h2>

          <p className="text-white/90 text-xs sm:text-sm leading-relaxed max-w-xl">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#3d8318] text-xs font-extrabold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#5cb028]" />
              <span>Create Retrospective</span>
            </button>
          </div>
        )}
      </div>

      {/* 4-Card Metric Stat Row (Digiflux Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Retros (Green Icon Box) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#eaf5e3] border border-[#cdeac0] text-[#3d8318] flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Retros</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{sessions.length}</p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">All sprint boards</p>
          </div>
        </div>

        {/* Metric 2: Active Sessions (Green Icon Box) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#eaf5e3] border border-[#cdeac0] text-[#3d8318] flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-[#5cb028]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Sessions</p>
            <p className="text-xl sm:text-2xl font-black text-[#3d8318] leading-tight">{activeSessionsCount}</p>
            <p className="text-[11px] text-emerald-600 font-semibold truncate mt-0.5">Live & in progress</p>
          </div>
        </div>

        {/* Metric 3: Discussion Topics (Rose Icon Box) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Sprint Topics</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{totalTopicsCount}</p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">Questions configured</p>
          </div>
        </div>

        {/* Metric 4: Completed Retros (Amber Icon Box) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Completed</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{completedCount}</p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">Resolved sprints</p>
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
