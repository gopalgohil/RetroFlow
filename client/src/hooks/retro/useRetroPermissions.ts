'use client';

import { useMemo, useCallback } from 'react';
import { RetroBoard, StickyCard } from '@/types/retro';

export interface UseRetroPermissionsParams {
  currentUser: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    projectRole?: string;
    isGuest?: boolean;
  } | null;
  currentAuthorName: string;
  verifiedGuestEmail: string | null;
  retro: RetroBoard | null;
}

/**
 * Modular Hook: useRetroPermissions
 * Encapsulates role resolution, facilitator checks, author verification,
 * and column moving permissions into a clean, testable unit.
 */
export function useRetroPermissions({
  currentUser,
  currentAuthorName,
  verifiedGuestEmail,
  retro,
}: UseRetroPermissionsParams) {
  // Facilitator & Sprint Export Access (Admin, Manager, Project Lead)
  const canExportToSprint = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase().trim();
    const email = (currentUser.email || '').toLowerCase().trim();

    // 1. Workspace Admin
    if (role === 'admin') return true;

    // 2. Manager or Lead
    const projRole = (currentUser.projectRole || '').toLowerCase().trim();
    if (
      projRole === 'manager' ||
      projRole === 'project lead' ||
      role === 'manager' ||
      role === 'project lead' ||
      role === 'team lead' ||
      role.includes('lead') ||
      role.includes('manager')
    ) {
      return true;
    }

    // 3. Creator of the retro board
    if (retro?.createdBy) {
      if (typeof retro.createdBy === 'object') {
        const creator = retro.createdBy as any;
        if (creator._id === currentUser.id || creator.email === currentUser.email) {
          return true;
        }
      } else if (String(retro.createdBy) === String(currentUser.id)) {
        return true;
      }
    }

    // 4. Project Lead or Project Manager on linked project
    if (retro?.project) {
      const projLeadEmail = retro.project.lead?.email?.toLowerCase().trim();
      if (projLeadEmail && projLeadEmail === email) {
        return true;
      }
      const member = retro.project.members?.find(
        (m: any) => (m.email || '').toLowerCase().trim() === email
      );
      if (member) {
        const mRole = (member.role || '').toLowerCase().trim();
        if (mRole === 'manager' || mRole.includes('lead') || mRole.includes('manager')) {
          return true;
        }
      }
    }

    return false;
  }, [currentUser, retro?.createdBy, retro?.project]);

  const isFacilitator = canExportToSprint;

  // Determine if current participant is an unregistered / external guest
  const isGuest = useMemo(() => {
    if (currentUser?.isGuest) return true;
    if (verifiedGuestEmail && !currentUser?.id) return true;

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('retroflow_token');
      if (!token || token.startsWith('guest-token-')) {
        return true;
      }
    }

    if (!currentUser?.id && !currentUser?.role) {
      return true;
    }

    return false;
  }, [currentUser, verifiedGuestEmail]);

  // Derive dynamic user role (Admin, Manager, Developer, etc.)
  const effectiveUserRole = useMemo(() => {
    if (!currentUser) {
      return 'Developer';
    }

    const emailLower = (currentUser.email || '').toLowerCase().trim();
    const wsRole = (currentUser.role || '').toLowerCase().trim();
    const projRole = currentUser.projectRole?.trim();

    if (wsRole === 'admin') return 'Admin';

    if (retro?.project) {
      const leadEmail = (retro.project.lead?.email || '').toLowerCase().trim();
      if (leadEmail && leadEmail === emailLower) return 'Manager';

      if (Array.isArray(retro.project.members)) {
        const member = retro.project.members.find(
          (m: any) => (m.email || '').toLowerCase().trim() === emailLower
        );
        if (member?.role && member.role !== 'Unassigned') {
          return member.role;
        }
      }
    }

    if (projRole && projRole !== 'Unassigned' && projRole.toLowerCase() !== 'member') {
      return projRole;
    }

    return 'Developer';
  }, [currentUser, retro?.project]);

  // Cross-Column Card Moving Permission: Strictly Admin and Manager only
  const canMoveCrossColumn = useMemo(() => {
    if (!currentUser) return false;
    const wsRole = (currentUser.role || '').toLowerCase().trim();
    const projRole = (currentUser.projectRole || '').toLowerCase().trim();
    const effective = (effectiveUserRole || '').toLowerCase().trim();

    if (wsRole === 'admin' || effective === 'admin') return true;

    if (
      wsRole === 'manager' ||
      wsRole === 'project lead' ||
      wsRole === 'team lead' ||
      wsRole.includes('manager') ||
      wsRole.includes('lead') ||
      projRole === 'manager' ||
      projRole === 'project lead' ||
      projRole.includes('manager') ||
      projRole.includes('lead') ||
      effective === 'manager' ||
      effective.includes('lead')
    ) {
      return true;
    }

    if (canExportToSprint) return true;

    return false;
  }, [currentUser, effectiveUserRole, canExportToSprint]);

  // Author & Card Modification Guards
  const isAuthorOfCard = useCallback(
    (card: StickyCard) => {
      if (
        currentUser?.email &&
        card.authorEmail &&
        currentUser.email.trim().toLowerCase() === card.authorEmail.trim().toLowerCase()
      ) {
        return true;
      }
      if (
        card.author &&
        currentAuthorName &&
        card.author.trim().toLowerCase() === currentAuthorName.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    },
    [currentUser?.email, currentAuthorName]
  );

  const canEditCard = useCallback(
    (card: StickyCard) => isAuthorOfCard(card),
    [isAuthorOfCard]
  );

  const canDeleteCard = useCallback(
    (card: StickyCard) => {
      if (isFacilitator) return true;
      return isAuthorOfCard(card);
    },
    [isFacilitator, isAuthorOfCard]
  );

  const canManageCard = canDeleteCard;

  return {
    canExportToSprint,
    isFacilitator,
    isGuest,
    effectiveUserRole,
    canMoveCrossColumn,
    isAuthorOfCard,
    canEditCard,
    canDeleteCard,
    canManageCard,
  };
}

export default useRetroPermissions;
