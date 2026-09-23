'use client';

import React, { useState, useEffect } from 'react';
import { Project } from '@/types/project';
import { OverviewKpiGrid } from './OverviewKpiGrid';
import { OverviewRecentRetros } from './OverviewRecentRetros';
import { OverviewContributors } from './OverviewContributors';

export interface OverviewTabProps {
  project: Project;
  onNavigateToTab: (tab: string) => void;
  canManageProject?: boolean;
  currentUserRole?: string;
}

/**
 * OverviewTab:
 * Clean, production-grade layout orchestrator for the project overview tab.
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  project,
  onNavigateToTab,
  canManageProject,
}) => {
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string; role?: string } | null>(null);

  useEffect(() => {
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

  const leadOrManager =
    project.members?.find((m) => (m.role || '').toLowerCase() === 'manager') ||
    project.members?.find((m) => (m.role || '').toLowerCase() === 'project lead') ||
    project.lead;
  const leadRoleLabel =
    leadOrManager && 'role' in leadOrManager && (leadOrManager.role || '').toLowerCase() === 'project lead'
      ? 'Lead'
      : 'Manager';
  const leadDisplayName = leadOrManager?.name || 'Assigned Manager';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Reusable KPI Metric Cards Grid */}
      <OverviewKpiGrid
        project={project}
        activeSprint={activeSprint}
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        todoTasks={todoTasks}
        totalMembers={totalMembers}
        leadRoleLabel={leadRoleLabel}
        leadDisplayName={leadDisplayName}
      />

      {/* 2. Bottom Row: Quick Retros & Team Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverviewRecentRetros
          retrospectives={project.retrospectives}
          onViewAll={() => onNavigateToTab('retros')}
        />

        <OverviewContributors
          members={project.members}
          projectKey={project.key}
          canManageProject={Boolean(isUserLead)}
          onViewTeam={() => onNavigateToTab('team')}
        />
      </div>
    </div>
  );
};

export default OverviewTab;
