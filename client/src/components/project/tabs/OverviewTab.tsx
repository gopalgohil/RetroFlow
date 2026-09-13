'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Clock,
  CheckCircle2,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { Project } from '@/types/project';
import { MetricCard, StatusPill, UserAvatar } from '@/components/ui';
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
    (project.sprints || []).find((s) => s.status === 'active') ||
    (project.sprints || [])[0];

  const totalTasks = activeSprint?.items?.length || 0;
  const completedTasks = activeSprint?.items?.filter((it) => it.status === 'done').length || 0;
  const todoTasks = totalTasks - completedTasks;
  const totalMembers = project.members?.length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Project Lead Recognition Banner */}
      {isUserLead && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 border border-amber-300/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-amber-900">
                You are Manager
              </p>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-200/80 text-amber-950 border border-amber-300">
                Full Control
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Welcome, <strong>{currentUser?.name || 'Manager'}</strong>! You have manager privileges to plan sprints, track velocity, and launch retrospectives for <strong>{project.name}</strong>.
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
          value={activeSprint ? `${activeSprint.daysLeft ?? 0} Days` : 'No Sprint'}
          unit={activeSprint ? 'remaining' : ''}
          icon={<Clock className="w-4 h-4" />}
          variant={activeSprint ? 'indigo' : 'default'}
          progress={
            activeSprint
              ? {
                  current: activeSprint.completedStoryPoints ?? 0,
                  total: activeSprint.totalStoryPoints || 1,
                  label: activeSprint.name ? activeSprint.name.split(' - ')[0] : 'Sprint Active',
                }
              : undefined
          }
          subtitle={!activeSprint ? 'No active sprint running for this project.' : undefined}
        />

        {/* Metric 3: Sprint Tasks Progress */}
        <MetricCard
          title="Tasks Progress"
          value={activeSprint ? `${completedTasks} / ${totalTasks}` : '0 / 0'}
          unit="completed"
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant={activeSprint && completedTasks === totalTasks && totalTasks > 0 ? 'success' : 'indigo'}
          progress={
            activeSprint
              ? {
                  current: completedTasks,
                  total: totalTasks || 1,
                  label: `${totalTasks} sprint items`,
                }
              : undefined
          }
          subtitle={
            !activeSprint
              ? 'No active sprint in progress.'
              : totalTasks === 0
              ? 'No tasks assigned in this sprint yet.'
              : `${todoTasks} remaining task${todoTasks !== 1 ? 's' : ''} in active cycle.`
          }
        />

        {/* Metric 4: Team Contributors */}
        <MetricCard
          title="Team Roster"
          value={totalMembers}
          unit={`contributor${totalMembers !== 1 ? 's' : ''}`}
          icon={<Users className="w-4 h-4" />}
          variant="violet"
          subtitle={`Lead: ${project.lead?.name || 'Assigned Lead'} • ${project.type?.toUpperCase() || 'SCRUM'}`}
        />
      </div>

      {/* 2. Bottom Row: Quick Retros & Team Contributors */}
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
