'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ProjectMember } from '@/types/project';
import { UserAvatar, StatusPill } from '@/components/ui';

export interface OverviewContributorsProps {
  members: ProjectMember[];
  projectKey: string;
  canManageProject: boolean;
  onViewTeam: () => void;
}

/**
 * OverviewContributors:
 * Quick overview widget for project contributors and roles.
 */
export const OverviewContributors: React.FC<OverviewContributorsProps> = ({
  members = [],
  projectKey,
  canManageProject,
  onViewTeam,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Contributors</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {members.length} members assigned to {projectKey}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewTeam}
          className="text-xs font-bold text-[#88c958] hover:text-[#76b349] flex items-center gap-1 cursor-pointer"
        >
          <span>{canManageProject ? 'Manage Team' : 'View Team Directory'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {members.slice(0, 4).map((member) => (
          <div
            key={member.id}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/70 dark:border-white/[0.08] flex items-center gap-2.5"
          >
            <UserAvatar
              name={member.name}
              email={member.email}
              title={member.email}
              avatar={member.avatar}
              size="md"
              status="online"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
              <StatusPill status={member.role} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewContributors;
