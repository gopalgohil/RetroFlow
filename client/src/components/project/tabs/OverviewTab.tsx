'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Project } from '@/types/project';
import { MetricCard, StatusPill, UserAvatar, ProgressBar } from '@/components/ui';
import { formatDateDMY } from '@/lib/dateUtils';

interface OverviewTabProps {
  project: Project;
  onNavigateToTab: (tab: string) => void;
  canManageProject?: boolean;
  currentUserRole?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  project,
  onNavigateToTab,
  canManageProject,
  currentUserRole = 'Developer',
}) => {
  const [currentUser, setCurrentUser] = React.useState<{ email?: string; name?: string; role?: string } | null>(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('retroflow_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  const userEmail = currentUser?.email?.toLowerCase().trim();
  const isUserLead =
    canManageProject !== undefined
      ? canManageProject
      : Boolean(
          userEmail &&
            (project.lead?.email?.toLowerCase().trim() === userEmail ||
              project.members?.some(
                (m) => m.email?.toLowerCase().trim() === userEmail && m.role === 'Manager'
              ))
        );

  const activeSprint =
    project.activeSprint ||
    project.sprints.find((s) => s.status === 'active') ||
    project.sprints[0];

  const completionPercentage = activeSprint?.totalStoryPoints
    ? Math.round((activeSprint.completedStoryPoints / activeSprint.totalStoryPoints) * 100)
    : 0;

  const avgVelocity = Math.round(
    project.velocityHistory.reduce((sum, v) => sum + v.completedPoints, 0) /
      (project.velocityHistory.length || 1)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Project Lead Recognition Banner */}
      {isUserLead && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 border border-amber-300/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-amber-900">
                You are Project Lead / Manager
              </p>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-200/80 text-amber-950 border border-amber-300">
                Full Control
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Welcome, <strong>{currentUser?.name || 'Project Lead'}</strong>! You have lead privileges to plan sprints, track velocity, and launch retrospectives for <strong>{project.name}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToTab('sprints')}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs transition-colors cursor-pointer"
            >
              Plan Sprints
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('retros')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              Retrospectives
            </button>
          </div>
        </div>
      )}
      {/* 1. Reusable KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Health Status */}
        <MetricCard
          title="Project Health"
          value={
            <div className="flex items-center gap-2">
              <span
                className={
                  project.healthStatus === 'on_track' ? 'text-emerald-700' : 'text-amber-700'
                }
              >
                {project.healthStatus === 'on_track' ? 'On Track' : 'At Risk'}
              </span>
              <StatusPill status={project.healthStatus} pulse />
            </div>
          }
          icon={<Activity className="w-4 h-4" />}
          variant={project.healthStatus === 'on_track' ? 'success' : 'warning'}
          subtitle={
            project.healthStatus === 'on_track'
              ? 'Velocity matches sprint commitments. 94% predictability.'
              : 'Staging environment blockers impacting active sprint delivery.'
          }
        />

        {/* Metric 2: Active Sprint Days Left */}
        <MetricCard
          title="Sprint Timeline"
          value={`${activeSprint?.daysLeft ?? 0} Days`}
          unit="remaining"
          icon={<Clock className="w-4 h-4" />}
          variant="indigo"
          progress={{
            current: activeSprint?.completedStoryPoints ?? 0,
            total: activeSprint?.totalStoryPoints ?? 1,
            label: activeSprint?.name ? activeSprint.name.split(' - ')[0] : 'Sprint Active',
          }}
        />

        {/* Metric 3: Open Blockers */}
        <MetricCard
          title="Open Blockers"
          value={activeSprint?.openBlockers ?? 0}
          unit="critical flags"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant={(activeSprint?.openBlockers || 0) > 0 ? 'danger' : 'success'}
          subtitle={
            (activeSprint?.openBlockers || 0) > 0
              ? '1 critical ticket requiring QA/DevOps intervention.'
              : 'Zero active blockers. Team flow unobstructed.'
          }
        />

        {/* Metric 4: Average Velocity */}
        <MetricCard
          title="Team Velocity"
          value={`${avgVelocity}`}
          trend={{ value: '+12% trend', isPositive: true }}
          icon={<TrendingUp className="w-4 h-4" />}
          variant="violet"
          subtitle="Calculated across previous completed 5 sprints."
        />
      </div>

      {/* 2. Middle Row: Velocity Visual Chart & Active Sprint Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity Mini-Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Sprint Velocity & Predictability
                <StatusPill status="upcoming" label="Last 5 Sprints" />
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of committed tasks versus actual items delivered.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-slate-200" />
                <span className="text-slate-600 text-[11px]">Committed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-indigo-600" />
                <span className="text-slate-900 font-semibold text-[11px]">Completed</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="pt-4">
            <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-slate-100 pb-2">
              {project.velocityHistory.map((item, idx) => {
                const maxPoints = 50;
                const committedHeight = Math.round((item.committedPoints / maxPoints) * 100);
                const completedHeight = Math.round((item.completedPoints / maxPoints) * 100);

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-xs mb-1 pointer-events-none">
                      {item.completedPoints}/{item.committedPoints}
                    </div>

                    <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-36">
                      <div
                        className="w-1/2 bg-slate-200/90 rounded-t-md transition-all duration-300 group-hover:bg-slate-300"
                        style={{ height: `${committedHeight}%` }}
                        title={`Committed: ${item.committedPoints}`}
                      />
                      <div
                        className="w-1/2 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-md transition-all duration-300 group-hover:from-indigo-600 group-hover:to-indigo-400 shadow-xs"
                        style={{ height: `${completedHeight}%` }}
                        title={`Completed: ${item.completedPoints}`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 truncate w-full text-center">
                      {item.sprintName.replace('Sprint ', 'S')}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>0</span>
              <span>25</span>
              <span>50 Target</span>
            </div>
          </div>
        </div>

        {/* Active Sprint Highlights Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-md space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <StatusPill status="active" label="Active Sprint" pulse />
              <span className="text-xs text-slate-400 font-mono">
                {activeSprint ? `Sprint #${activeSprint.number}` : 'Sprint'}
              </span>
            </div>

            <h4 className="text-base font-extrabold tracking-tight text-white">
              {activeSprint?.name || 'Current Development Cycle'}
            </h4>

            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                Sprint Goal
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                {activeSprint?.goal || 'Deliver committed sprint stories and resolve blockers.'}
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Sprint Progress</span>
                <span className="font-bold text-white">
                  {completionPercentage}% complete
                </span>
              </div>
              <ProgressBar
                value={activeSprint?.completedStoryPoints || 0}
                max={activeSprint?.totalStoryPoints || 1}
                variant="gradient"
                size="md"
              />
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('sprints')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>{canManageProject ? 'Manage Sprints & Backlog' : 'View Sprints & Backlog'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Bottom Row: Quick Retros & Team Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retros Status */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sprint Retrospectives</h3>
              <p className="text-xs text-slate-500">Continuous feedback loops for this team</p>
            </div>
            <button
              onClick={() => onNavigateToTab('retros')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({project.retrospectives.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {project.retrospectives.slice(0, 3).map((retro) => (
              <div
                key={retro.id}
                className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={retro.title} avatar="RF" size="md" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{retro.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span>{formatDateDMY(retro.scheduledDate)}</span>
                      <span>•</span>
                      <span>{retro.cardsCount} cards</span>
                      <span>•</span>
                      <span className="text-indigo-600 font-semibold">
                        {retro.actionItemsCount} action items
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/retro/${retro.shareToken}`}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-600 text-xs font-bold transition-all shadow-2xs"
                >
                  Open
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Team Contributors */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Contributors</h3>
              <p className="text-xs text-slate-500">
                {project.members.length} members assigned to {project.key}
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('team')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>{canManageProject ? 'Manage Team' : 'View Team Directory'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {project.members.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5"
              >
                <UserAvatar name={member.name} avatar={member.avatar} size="md" status="online" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{member.name}</p>
                  <StatusPill status={member.role} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
