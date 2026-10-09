'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy,
  Star,
  Sparkles,
  Users,
  Search,
  RefreshCw,
  Award,
  TrendingUp,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ScorecardApiService, TeamScoreboardData, MemberScorecardItem } from '@/services/scorecardApi';
import { UserAvatar, Modal } from '@/components/ui';

interface TeamScoreboardTabProps {
  isAdmin?: boolean;
}

export const TeamScoreboardTab: React.FC<TeamScoreboardTabProps> = ({ isAdmin = false }) => {
  const [data, setData] = useState<TeamScoreboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  // Rating Modal state
  const [ratingMember, setRatingMember] = useState<MemberScorecardItem | null>(null);
  const [ratings, setRatings] = useState<{
    quality: number;
    timeliness: number;
    communication: number;
    collaboration: number;
  }>({
    quality: 4,
    timeliness: 4,
    communication: 4,
    collaboration: 4,
  });
  const [feedback, setFeedback] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSuccessToast, setRatingSuccessToast] = useState<string | null>(null);

  const fetchScoreboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ScorecardApiService.getTeamScoreboard();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load team scoreboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScoreboard();
  }, [fetchScoreboard]);

  // Live dynamic calculation for rating modal
  const liveOverallScore = useMemo(() => {
    const q = ratings.quality * 0.35;
    const t = ratings.timeliness * 0.25;
    const c = ratings.communication * 0.25;
    const col = ratings.collaboration * 0.15;
    return Number((q + t + c + col).toFixed(2));
  }, [ratings]);

  const handleOpenRatingModal = (member: MemberScorecardItem) => {
    setRatingMember(member);
    setRatings({
      quality: member.breakdown.quality ? Math.round(member.breakdown.quality) : 4,
      timeliness: member.breakdown.timeliness ? Math.round(member.breakdown.timeliness) : 4,
      communication: member.breakdown.communication ? Math.round(member.breakdown.communication) : 4,
      collaboration: member.breakdown.collaboration ? Math.round(member.breakdown.collaboration) : 4,
    });
    setFeedback('');
  };

  const handleSubmitRating = async () => {
    if (!ratingMember) return;
    setIsSubmittingRating(true);
    try {
      await ScorecardApiService.submitScorecards(
        [
          {
            memberId: ratingMember.memberId,
            memberName: ratingMember.name,
            memberEmail: ratingMember.email,
            memberRole: ratingMember.role,
            ratings,
            feedback,
          },
        ],
        { retroTitle: 'On-Demand Evaluation' }
      );
      setRatingSuccessToast(`Performance rating saved for ${ratingMember.name}!`);
      setTimeout(() => setRatingSuccessToast(null), 3500);
      setRatingMember(null);
      await fetchScoreboard();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save evaluation.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Filter members
  const filteredMembers = useMemo(() => {
    const list = data?.members || [];
    return list.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (selectedTier === 'all') return true;
      if (selectedTier === 'top') return m.overallScore >= 4.5;
      if (selectedTier === 'strong') return m.overallScore >= 4.0 && m.overallScore < 4.5;
      if (selectedTier === 'meeting') return m.overallScore >= 3.0 && m.overallScore < 4.0;
      if (selectedTier === 'coaching') return m.totalEvaluations > 0 && m.overallScore < 3.0;
      if (selectedTier === 'unrated') return m.totalEvaluations === 0;

      return true;
    });
  }, [data?.members, searchQuery, selectedTier]);

  const renderStars = (score: number) => {
    const stars = [];
    const rounded = Math.round(score);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rounded
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-300 dark:text-slate-600'
          }`}
        />
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const getTierBadge = (score: number, evaluationsCount: number) => {
    if (evaluationsCount === 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
          Unrated
        </span>
      );
    }
    if (score >= 4.5) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Top Performer
        </span>
      );
    }
    if (score >= 4.0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          Strong Contributor
        </span>
      );
    }
    if (score >= 3.0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          Meets Expectations
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
        Needs Coaching
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Team Performance Scoreboard
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Admin Only
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluated with weighted business formula: Quality (35%), Timeliness (25%), Communication (25%), Collaboration (15%)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchScoreboard}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {ratingSuccessToast && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{ratingSuccessToast}</span>
        </div>
      )}

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Team Avg Rating */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Team Average Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.kpis.teamAverageScore ? data.kpis.teamAverageScore.toFixed(2) : '—'}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 5.00</span>
          </div>
          {data?.kpis.teamAverageScore ? renderStars(data.kpis.teamAverageScore) : null}
        </div>

        {/* Top Performer */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Top Performer 🏆</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="truncate">
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {data?.kpis.topPerformer?.name || 'No evaluations yet'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              {data?.kpis.topPerformer ? `★ ${data.kpis.topPerformer.score.toFixed(2)} (${data.kpis.topPerformer.role})` : 'Awaiting reviews'}
            </p>
          </div>
        </div>

        {/* Members Rated */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Members Rated</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.kpis.totalRatedMembers || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              of {data?.kpis.totalMembers || 0} members
            </span>
          </div>
        </div>

        {/* Strongest Category */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Strongest Category</span>
            <ShieldCheck className="w-4 h-4 text-[#88c958]" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {data?.kpis.highestCategory || 'Quality (35%)'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Highest team-wide ratings</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member, role, or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#88c958]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Members' },
            { id: 'top', label: 'Top (≥4.5)' },
            { id: 'strong', label: 'Strong (4.0-4.4)' },
            { id: 'meeting', label: 'Meets (3.0-3.9)' },
            { id: 'unrated', label: 'Unrated' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTier(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                selectedTier === tab.id
                  ? 'bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a]'
                  : 'bg-slate-100 dark:bg-[#12151c] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Scoreboard Roster Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading team scoreboard...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-[#0e1015] rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
          No team members found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((member, index) => (
            <div
              key={member.memberId || member.email}
              className="p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.15] transition-all flex flex-col justify-between gap-4"
            >
              {/* Member Info & Overall Stars */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <UserAvatar name={member.name || member.email} email={member.email} avatar={member.avatar} size="lg" />
                    {member.overallScore >= 4.5 && (
                      <span className="absolute -top-1 -right-1 text-xs select-none">👑</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className="text-sm font-bold text-slate-900 dark:text-white truncate"
                        title={member.name || member.email}
                      >
                        {member.name || member.email?.split('@')[0] || 'Team Member'}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">#{index + 1}</span>
                    </div>
                    <p
                      className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal"
                      title={member.email}
                    >
                      {member.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]">
                        {member.role || 'Developer'}
                      </span>
                      {getTierBadge(member.overallScore, member.totalEvaluations)}
                    </div>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {member.overallScore > 0 ? member.overallScore.toFixed(2) : '—'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">/ 5.0</span>
                  </div>
                  {member.overallScore > 0 && renderStars(member.overallScore)}
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                    {member.totalEvaluations} {member.totalEvaluations === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </div>

              {/* 4 Weighted Breakdown Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                    <span>Quality</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {member.breakdown.quality ? `${member.breakdown.quality}★` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${(member.breakdown.quality / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">35% weight</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                    <span>Timeliness</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {member.breakdown.timeliness ? `${member.breakdown.timeliness}★` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full"
                      style={{ width: `${(member.breakdown.timeliness / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">25% weight</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                    <span>Comms</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {member.breakdown.communication ? `${member.breakdown.communication}★` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${(member.breakdown.communication / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">25% weight</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                    <span>Collab</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {member.breakdown.collaboration ? `${member.breakdown.collaboration}★` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${(member.breakdown.collaboration / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">15% weight</span>
                </div>
              </div>

              {/* Latest Feedback & Rate Button */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate max-w-[260px]">
                  {member.latestFeedback ? `"${member.latestFeedback}"` : 'No written feedback yet'}
                </p>

                <button
                  type="button"
                  onClick={() => handleOpenRatingModal(member)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Rate Member</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. On-Demand Rating Modal */}
      {ratingMember && (
        <Modal
          isOpen={Boolean(ratingMember)}
          onClose={() => setRatingMember(null)}
          title={`Rate ${ratingMember.name}`}
          description="Evaluate performance using Mehul's 4 weighted business criteria"
          icon={<Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
          maxWidth="2xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => setRatingMember(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRating}
                disabled={isSubmittingRating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingRating ? 'Saving...' : 'Save Performance Rating'}</span>
              </button>
            </>
          }
        >
          <div className="space-y-5">
            {/* Live Calculation Preview Banner */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                  Weighted Score Formula:
                </span>
                <span className="text-xs text-amber-900 dark:text-amber-200 font-mono">
                  ({ratings.quality}×35% + {ratings.timeliness}×25% + {ratings.communication}×25% + {ratings.collaboration}×15%)
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                  ★ {liveOverallScore.toFixed(2)}
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 block font-bold">
                  / 5.00
                </span>
              </div>
            </div>

            {/* 4 Criteria Star Inputs */}
            <div className="space-y-4">
              {/* Quality */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    🛠️ Code Quality
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                      35% Weight
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Clean code, minimal bugs, thorough test coverage
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatings((prev) => ({ ...prev, quality: s }))}
                      className="p-1 hover:scale-115 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= ratings.quality
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeliness */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    ⏱️ Timeliness & Delivery
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold">
                      25% Weight
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sprint deadlines met, action items delivered on time
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatings((prev) => ({ ...prev, timeliness: s }))}
                      className="p-1 hover:scale-115 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= ratings.timeliness
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Communication */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    💬 Communication & Standups
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                      25% Weight
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Proactive updates, clear blocker raising, retro feedback
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatings((prev) => ({ ...prev, communication: s }))}
                      className="p-1 hover:scale-115 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= ratings.communication
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Collaboration */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    🤝 Collaboration & Mentorship
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold">
                      15% Weight
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    PR reviews, helping teammates, positive agile spirit
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatings((prev) => ({ ...prev, collaboration: s }))}
                      className="p-1 hover:scale-115 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= ratings.collaboration
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Written Feedback */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Performance Feedback / Commendation (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                placeholder="E.g. Great job resolving critical 3DS blocker before sprint release..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#88c958]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeamScoreboardTab;
