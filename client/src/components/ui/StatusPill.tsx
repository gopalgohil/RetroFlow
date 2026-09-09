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
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          defaultLabel: status === 'on_track' ? 'On Track' : 'Active',
          hasDot: true,
        };
      case 'at_risk':
      case 'qa':
      case 'draft':
        return {
          pill: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          defaultLabel: status === 'at_risk' ? 'At Risk' : status,
          hasDot: normalized === 'at_risk',
        };
      case 'delayed':
      case 'bug':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          defaultLabel: status === 'delayed' ? 'Delayed' : 'Bug',
          hasDot: normalized === 'delayed',
        };
      case 'upcoming':
      case 'manager':
        return {
          pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          defaultLabel: status,
          hasDot: false,
        };
      case 'developer':
        return {
          pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          defaultLabel: 'Developer',
          hasDot: false,
        };
      case 'action_item':
        return {
          pill: 'bg-violet-50 text-violet-800 border-violet-200',
          dot: 'bg-violet-500',
          defaultLabel: 'Action Item',
          hasDot: false,
        };
      case 'story':
        return {
          pill: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          defaultLabel: 'Story',
          hasDot: false,
        };
      case 'completed':
      case 'viewer':
      default:
        return {
          pill: 'bg-slate-100 text-slate-700 border-slate-200',
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
