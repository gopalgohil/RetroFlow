'use client';

import React from 'react';

export type StatusPillType =
  | 'on_track'
  | 'at_risk'
  | 'delayed'
  | 'active'
  | 'upcoming'
  | 'completed'
  | 'draft'
  | 'Manager'
  | 'Developer'
  | 'QA'
  | 'Viewer'
  | 'story'
  | 'bug'
  | 'task'
  | 'action_item';

export interface StatusPillProps {
  status: StatusPillType | string;
  label?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  pulse = false,
  className = '',
}) => {
  const normalized = status.toLowerCase();

  const getStyles = () => {
    switch (normalized) {
      case 'on_track':
      case 'active':
        return {
          pill: 'bg-emerald-50 dark:bg-[#88c958]/10 text-emerald-700 dark:text-[#88c958] border-emerald-200 dark:border-[#88c958]/30',
          dot: 'bg-[#88c958]',
          defaultLabel: status === 'on_track' ? 'On Track' : 'Active',
          hasDot: true,
        };
      case 'at_risk':
      case 'qa':
      case 'draft':
        return {
          pill: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
          dot: 'bg-amber-400',
          defaultLabel: status === 'at_risk' ? 'At Risk' : status,
          hasDot: normalized === 'at_risk',
        };
      case 'delayed':
      case 'bug':
        return {
          pill: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
          dot: 'bg-rose-400',
          defaultLabel: status === 'delayed' ? 'Delayed' : 'Bug',
          hasDot: normalized === 'delayed',
        };
      case 'upcoming':
        return {
          pill: 'bg-[#eaf5e3] dark:bg-[#88c958]/10 text-[#3d8318] dark:text-[#88c958] border-[#cdeac0] dark:border-[#88c958]/30',
          dot: 'bg-[#88c958]',
          defaultLabel: status,
          hasDot: false,
        };
      case 'developer':
        return {
          pill: 'bg-emerald-50 dark:bg-white/[0.06] text-emerald-800 dark:text-slate-200 border-emerald-200 dark:border-white/[0.08]',
          dot: 'bg-[#88c958]',
          defaultLabel: 'Developer',
          hasDot: false,
        };
      case 'action_item':
        return {
          pill: 'bg-[#eaf5e3] dark:bg-[#88c958]/10 text-[#3d8318] dark:text-[#88c958] border-[#cdeac0] dark:border-[#88c958]/30',
          dot: 'bg-[#88c958]',
          defaultLabel: 'Action Item',
          hasDot: false,
        };
      case 'unassigned':
        return {
          pill: 'bg-amber-50/90 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300/90 dark:border-amber-500/30',
          dot: 'bg-amber-400',
          defaultLabel: 'Unassigned',
          hasDot: true,
        };
      case 'devops':
        return {
          pill: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
          dot: 'bg-cyan-400',
          defaultLabel: 'DevOps',
          hasDot: false,
        };
      case 'designer':
        return {
          pill: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
          dot: 'bg-purple-400',
          defaultLabel: 'Designer',
          hasDot: false,
        };
      case 'admin':
      case 'manager':
        return {
          pill: 'bg-[#eaf5e3] dark:bg-[#88c958]/10 text-[#3d8318] dark:text-[#88c958] border-[#cdeac0] dark:border-[#88c958]/30',
          dot: 'bg-[#88c958]',
          defaultLabel: status === 'manager' ? 'Manager' : 'Admin',
          hasDot: false,
        };
      case 'project lead':
      case 'project_lead':
        return {
          pill: 'bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-500/30',
          dot: 'bg-sky-400',
          defaultLabel: 'Project Lead',
          hasDot: false,
        };
      case 'story':
        return {
          pill: 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
          dot: 'bg-blue-400',
          defaultLabel: 'Story',
          hasDot: false,
        };
      case 'completed':
      case 'viewer':
      default:
        return {
          pill: 'bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]',
          dot: 'bg-slate-400',
          defaultLabel: status.replace('_', ' '),
          hasDot: false,
        };
    }
  };

  const config = getStyles();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider select-none ${config.pill} ${className}`}
    >
      {config.hasDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dot} ${
            pulse || normalized === 'active' || normalized === 'on_track' ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};

export default StatusPill;
