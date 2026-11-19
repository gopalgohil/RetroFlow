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
  // Dynamically link with the active or matching retrospective to ensure timeline dates and remaining days are 100% synchronized
  const linkedRetro = project?.retrospectives?.find((r) => {
    if (!activeSprint) return false;
    const sMatch = activeSprint.name?.match(/\d+/);
    const sNum = activeSprint.number || (sMatch ? parseInt(sMatch[0], 10) : null);
    const rMatch = (r.sprintName || r.title || '').match(/\d+/);
    const rNum = rMatch ? parseInt(rMatch[0], 10) : null;
    return Boolean(sNum && rNum && sNum === rNum);
  }) || project?.retrospectives?.find((r) => r.status === 'active');

  const effectiveStartDate = linkedRetro?.startDate || activeSprint?.startDate;
  const effectiveEndDate = linkedRetro?.endDate || activeSprint?.endDate;

  const totalSprintDays = effectiveStartDate && effectiveEndDate
    ? Math.max(
        1,
        Math.ceil(
          (new Date(effectiveEndDate).getTime() - new Date(effectiveStartDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : (activeSprint?.daysLeft && activeSprint.daysLeft > 0 ? activeSprint.daysLeft : 14);

  const rawRemaining = effectiveEndDate
    ? Math.ceil((new Date(effectiveEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : (activeSprint?.daysLeft ?? 0);

  const isCompleted = activeSprint?.status === 'completed' || (linkedRetro && linkedRetro.status === 'completed');
  const daysRemaining = activeSprint && !isCompleted ? Math.max(0, Math.min(totalSprintDays, rawRemaining)) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      <MetricCard
        title="Sprint Timeline"
        value={activeSprint ? `${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}` : 'No Sprint'}
        unit={activeSprint ? 'remaining' : ''}
        icon={<Clock className="w-4 h-4" />}
        variant={activeSprint ? 'indigo' : 'default'}
        progress={
          activeSprint
            ? {
                current: activeSprint.completedStoryPoints ?? 0,
                total: activeSprint.totalStoryPoints || 1,
                label: activeSprint.name ? activeSprint.name.split(' - ')[0] : (linkedRetro?.title || 'Sprint Active'),
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
