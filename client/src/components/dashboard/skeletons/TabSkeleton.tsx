'use client';

import React from 'react';
import { SessionsSkeleton } from './SessionsSkeleton';
import { MembersSkeleton } from './MembersSkeleton';
import { SettingsSkeleton } from './SettingsSkeleton';
import { ProjectsTabSkeleton } from './ProjectsSkeleton';
import { ActionItemsSkeleton } from './ActionItemsSkeleton';

export interface TabSkeletonProps {
  tab: string;
}

/**
 * Dynamically renders the component-matched skeleton loader based on the active tab
 */
export const TabSkeleton: React.FC<TabSkeletonProps> = ({ tab }) => {
  switch (tab) {
    case 'action_items':
      return <ActionItemsSkeleton />;
    case 'projects':
      return <ProjectsTabSkeleton />;
    case 'members':
      return <MembersSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    case 'sessions':
    default:
      return <SessionsSkeleton />;
  }
};
