'use client';

import React from 'react';
import { Clock, CheckCircle2, Users } from 'lucide-react';
import { Project, Sprint } from '@/types/project';
import { MetricCard } from '@/components/ui';

export interface OverviewKpiGridProps {
  project?: Project;
  activeSprint?: Sprint;
  totalTasks: number;
  completedTasks: number;
  todoTasks: number;
  totalMembers: number;
  leadRoleLabel: string;
  leadDisplayName: string;
}

export const OverviewKpiGrid: React.FC<OverviewKpiGridProps> = ({
  project,
  activeSprint,
  totalTasks,
  completedTasks,
  todoTasks,
  totalMembers,
  leadRoleLabel,
  leadDisplayName,
}) => {
  const totalSprintDays = activeSprint?.startDate && activeSprint?.endDate
    ? Math.max(
        1,
        Math.ceil(
          (new Date(activeSprint.endDate).getTime() - new Date(activeSprint.startDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 30;

  const rawRemaining = activeSprint?.endDate
    ? Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : (activeSprint?.daysLeft ?? 0);

  const daysRemaining = activeSprint ? Math.max(0, Math.min(totalSprintDays, rawRemaining)) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      <MetricCard
        title="Sprint Timeline"
        value={activeSprint ? `${daysRemaining} Days` : 'No Sprint'}
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

      <MetricCard
        title="Team Roster"
        value={totalMembers}
        unit={`contributor${totalMembers !== 1 ? 's' : ''}`}
        icon={<Users className="w-4 h-4" />}
        variant="violet"
        subtitle={`${leadRoleLabel}: ${leadDisplayName}`}
      />
    </div>
  );
};

export default OverviewKpiGrid;
