'use client';

import React, { useState } from 'react';
import { Project } from '@/types/project';
import { TeamMembersList } from './TeamMembersList';
import { InviteMemberModal } from './InviteMemberModal';
import { ProjectGeneralSettings } from './ProjectGeneralSettings';
import { ProjectDangerZone } from './ProjectDangerZone';

export interface TeamSettingsTabProps {
  project: Project;
  onProjectUpdated: (updated: Project) => void;
  canManageProject?: boolean;
  canDeleteProject?: boolean;
  currentUserRole?: string;
}

export const TeamSettingsTab: React.FC<TeamSettingsTabProps> = ({
  project,
  onProjectUpdated,
  canManageProject = false,
  canDeleteProject = false,
  currentUserRole = 'Developer',
}) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <TeamMembersList
        project={project}
        canManageProject={canManageProject}
        onInviteClick={() => setIsInviteOpen(true)}
        onProjectUpdated={onProjectUpdated}
      />

      <ProjectGeneralSettings
        project={project}
        canManageProject={canManageProject}
        currentUserRole={currentUserRole}
        onProjectUpdated={onProjectUpdated}
      />

      <ProjectDangerZone
        project={project}
        canManageProject={canManageProject}
        canDeleteProject={canDeleteProject}
        onProjectUpdated={onProjectUpdated}
      />

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        project={project}
        onProjectUpdated={onProjectUpdated}
      />
    </div>
  );
};

export default TeamSettingsTab;
