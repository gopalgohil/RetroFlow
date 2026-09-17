'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Share2, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export interface RetroHeaderProps {
  title: string;
  description?: string;
  isFacilitator: boolean;
  currentAuthorName: string;
  remainingVotes: number;
  isRevealed: boolean;
  revealMode: boolean;
  socketConnected?: boolean;
  verifiedGuestEmail?: string | null;
  projectId?: string;
  projectKey?: string;
  sprintName?: string;
  userRole?: string;
  onToggleReveal: () => void;
  onOpenInvite: () => void;
  onEndSession?: () => void;
}

/**
 * Reusable Session Header Component
 * Provides clean role-based navigation, live status indicators, and facilitator controls.
 */
export const RetroHeader: React.FC<RetroHeaderProps> = memo(function RetroHeader({
  title,
  description,
  isFacilitator,
  currentAuthorName,
  remainingVotes,
  isRevealed,
  revealMode,
  socketConnected = true,
  verifiedGuestEmail,
  projectId,
  projectKey,
  sprintName,
  userRole,
  onToggleReveal,
  onOpenInvite,
  onEndSession,
}) {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (projectId || projectKey) {
      router.push(`/projects/${projectId || projectKey}?tab=retros`);
    } else {
      router.push('/dashboard?tab=sessions');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b0f17]/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
      {/* Left: Role-based Navigation + Session Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Smart Back button: returns directly to Retrospective Session tab */}
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-bold shadow-2xs group cursor-pointer"
          title="Back to Retrospective Sessions"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#5cb028] transition-colors" />
          <span className="text-slate-600 dark:text-slate-300 font-bold">
            {projectKey ? `Project ${projectKey}` : 'Retrospectives'}
          </span>
        </button>

        {/* Brand Logo - clickable back to main workspace dashboard retrospectives */}
        <Link
          href="/dashboard?tab=sessions"
          title="RetroFlow Retrospective Sessions"
          className="w-8 h-8 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 select-none transition-transform hover:scale-105"
        >
          RF
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md truncate">{description}</p>
          )}
        </div>
      </div>

      {/* Right: Status Tracker, Facilitator Pacing & Invite */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Facilitator Card Reveal Toggle */}
        {isFacilitator && revealMode && (
          <button
            onClick={onToggleReveal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isRevealed
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                : 'bg-[#5cb028] text-white border-[#5cb028] shadow-xs hover:bg-[#4e9921]'
            }`}
          >
            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isRevealed ? 'Hide Cards' : 'Reveal All Cards'}</span>
          </button>
        )}

        {/* Current Participant/Facilitator Role Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#5cb028] shrink-0" />
          <span
            className="truncate max-w-[130px]"
            title={verifiedGuestEmail ? `${currentAuthorName} (${verifiedGuestEmail})` : currentAuthorName}
          >
            {currentAuthorName}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
              userRole?.toLowerCase() === 'admin'
                ? 'bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#5cb028] border border-[#cdeac0] dark:border-[#5cb028]/30'
                : userRole?.toLowerCase() === 'manager' || userRole?.toLowerCase().includes('manager')
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                : userRole?.toLowerCase().includes('lead')
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                : userRole?.toLowerCase().includes('qa')
                ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                : userRole?.toLowerCase() === 'developer' || verifiedGuestEmail
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {userRole || (verifiedGuestEmail ? 'Developer' : 'Developer')}
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Invite Teammates Action (Restricted: Admin & Manager / Facilitator only) */}
        {isFacilitator && (
          <button
            onClick={onOpenInvite}
            className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#5cb028]" />
            <span className="hidden sm:inline">Invite Teammates</span>
          </button>
        )}

        {/* Facilitator End Session & Export Action */}
        {isFacilitator && onEndSession && (
          <button
            onClick={onEndSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-[#5cb028] dark:hover:bg-[#5cb028] text-white text-xs font-bold shadow-xs dark:border dark:border-slate-700 transition-all hover:scale-[1.02] cursor-pointer"
            title="End session and export action items to project backlog"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5cb028]" />
            <span>End Session</span>
          </button>
        )}
      </div>
    </header>
  );
});

export default RetroHeader;
