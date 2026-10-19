'use client';

import React from 'react';
import { SessionsSkeleton } from './SessionsSkeleton';
import { MembersSkeleton } from './MembersSkeleton';
import { SettingsSkeleton } from './SettingsSkeleton';
import { ProjectsTabSkeleton } from './ProjectsSkeleton';
import { ActionItemsSkeleton } from './ActionItemsSkeleton';
import { AnalyticsSkeleton } from '../tabs/analytics';

export interface TabSkeletonProps {
  tab: string;
  isAdmin?: boolean;
}

/**
 * Dynamically renders the component-matched skeleton loader based on the active tab
 */
export const TabSkeleton: React.FC<TabSkeletonProps> = ({ tab, isAdmin = false }) => {
  switch (tab) {
    case 'analytics':
      return <AnalyticsSkeleton showHeader={true} />;
    case 'action_items':
      return <ActionItemsSkeleton />;
    case 'projects':
      return <ProjectsTabSkeleton />;
    case 'members':
      return <MembersSkeleton isAdmin={isAdmin} />;
    case 'settings':
      return <SettingsSkeleton />;
    case 'sessions':
    default:
      return <SessionsSkeleton />;
  }
};
